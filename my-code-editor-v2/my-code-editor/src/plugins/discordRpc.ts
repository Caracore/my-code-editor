import { invoke } from "@tauri-apps/api/core";
import type { Plugin } from "./types";

/**
 * Discord application id used by the IDE's Rich Presence integration.
 * Hardcoded because Discord's IPC protocol expects a specific id registered
 * on the developer portal — making this user-editable would just break it.
 */
const DISCORD_APP_ID = "1451676636259811368";

/** Refresh activity at most once per N ms while the user is typing. */
const UPDATE_THROTTLE_MS = 4000;

interface PresenceSnapshot {
  file: string;
  language: string;
  project: string;
}

/**
 * Discord Rich Presence built-in plugin.
 *
 * Activated from Settings → Extensions. While active it:
 *   - opens the Discord IPC socket (no-op if Discord isn't running),
 *   - listens to the "discord-presence:update" event the workspace fires
 *     when the active tab / workspace changes, and pushes a throttled
 *     update to the daemon,
 *   - registers a "Discord: Reconnect" command for manual recovery,
 *   - cleanly disconnects on deactivate.
 */
const discordRpc: Plugin = {
  manifest: {
    id: "builtin.discord-rpc",
    name: "Discord Rich Presence",
    version: "1.0.0",
    description:
      "Show the file you are editing in your Discord profile. Requires Discord to be running.",
    author: "my-code-editor",
    source: "builtin",
  },
  async activate(api) {
    let connected = false;
    let lastSent: PresenceSnapshot | null = null;
    let lastSentAt = 0;
    let pendingTimer: number | null = null;
    let pendingSnapshot: PresenceSnapshot | null = null;

    const connect = async () => {
      try {
        await invoke("discord_connect", { appId: DISCORD_APP_ID });
        connected = true;
        api.log("connected to Discord IPC");
      } catch (err) {
        connected = false;
        api.log("failed to connect to Discord IPC:", err);
      }
    };

    const send = async (snap: PresenceSnapshot) => {
      if (!connected) return;
      try {
        await invoke("discord_update", { payload: snap });
        lastSent = snap;
        lastSentAt = Date.now();
      } catch (err) {
        api.log("update_discord_presence failed:", err);
        // Drop the connection flag; the user can reconnect manually.
        connected = false;
      }
    };

    const flushPending = () => {
      if (pendingTimer != null) {
        window.clearTimeout(pendingTimer);
        pendingTimer = null;
      }
      if (pendingSnapshot) {
        const snap = pendingSnapshot;
        pendingSnapshot = null;
        void send(snap);
      }
    };

    const queueUpdate = (snap: PresenceSnapshot) => {
      // Skip identical payloads.
      if (
        lastSent &&
        lastSent.file === snap.file &&
        lastSent.language === snap.language &&
        lastSent.project === snap.project
      ) {
        return;
      }
      const elapsed = Date.now() - lastSentAt;
      pendingSnapshot = snap;
      if (elapsed >= UPDATE_THROTTLE_MS) {
        flushPending();
        return;
      }
      if (pendingTimer != null) return;
      pendingTimer = window.setTimeout(flushPending, UPDATE_THROTTLE_MS - elapsed);
    };

    const onPresenceEvent = (e: Event) => {
      const detail = (e as CustomEvent<Partial<PresenceSnapshot>>).detail ?? {};
      queueUpdate({
        file: detail.file ?? "Idle",
        language: detail.language ?? "Code",
        project: detail.project ?? "my-code-editor",
      });
    };

    window.addEventListener("discord-presence:update", onPresenceEvent);
    api.onDeactivate(() => {
      window.removeEventListener("discord-presence:update", onPresenceEvent);
      if (pendingTimer != null) {
        window.clearTimeout(pendingTimer);
        pendingTimer = null;
      }
    });

    api.registerCommand({
      id: "reconnect",
      title: "Discord: Reconnect Rich Presence",
      group: "Plugins",
      run: async () => {
        try {
          await invoke("discord_disconnect");
        } catch {
          /* ignore — may already be disconnected */
        }
        connected = false;
        await connect();
        // Re-emit the last snapshot once we're back online.
        if (connected && lastSent) {
          await send(lastSent);
        }
      },
    });

    api.registerStatusBarItem({
      id: "discord",
      align: "right",
      order: 50,
      tooltip: "Discord Rich Presence",
      render: () => "Discord",
    });

    // Connect now and request the workspace to broadcast the current state.
    // Fire-and-forget: we never `await` this so toggling the plugin in
    // Settings stays instantaneous, even if Discord isn't running and the
    // IPC handshake takes a while to time out.
    void connect().then(() => {
      window.dispatchEvent(new CustomEvent("discord-presence:request"));
    });

    // Disconnect on deactivate.
    api.onDeactivate(() => {
      void invoke("discord_disconnect").catch(() => {});
      connected = false;
    });
  },
};

export default discordRpc;
