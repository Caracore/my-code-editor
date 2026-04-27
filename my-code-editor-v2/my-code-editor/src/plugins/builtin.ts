import type { Plugin } from "./types";
import discordRpc from "./discordRpc";

/**
 * Built-in showcase plugin: registers a "Hello, world" command so users can
 * see the plugin pipeline working end-to-end out of the box.
 */
const helloWorld: Plugin = {
  manifest: {
    id: "builtin.hello-world",
    name: "Hello World",
    version: "1.0.0",
    description: "Adds a friendly Hello-World command to the palette.",
    author: "my-code-editor",
    source: "builtin",
  },
  activate(api) {
    api.registerCommand({
      id: "sayHello",
      title: "Plugins: Say hello",
      group: "Plugins",
      run: () => {
        api.log("Hello from the built-in plugin!");
        // eslint-disable-next-line no-alert
        window.alert("Hello from the built-in plugin!");
      },
    });
  },
};

/**
 * Built-in clock status-bar item — demonstrates the status-bar API.
 */
const clock: Plugin = {
  manifest: {
    id: "builtin.clock",
    name: "Status Clock",
    version: "1.0.0",
    description: "Shows the current time in the status bar.",
    author: "my-code-editor",
    source: "builtin",
  },
  activate(api) {
    let now = new Date();
    const listeners = new Set<() => void>();
    const tick = () => {
      now = new Date();
      listeners.forEach((l) => l());
    };
    const interval = window.setInterval(tick, 30_000);
    api.onDeactivate(() => window.clearInterval(interval));

    api.registerStatusBarItem({
      id: "clock",
      align: "right",
      order: 100,
      tooltip: "Local time",
      render: () => {
        // Render uses the snapshot captured at render-time. The status bar
        // re-renders when the manager fires updates, so we ping listeners
        // every tick by bumping a no-op disposable later.
        const h = String(now.getHours()).padStart(2, "0");
        const m = String(now.getMinutes()).padStart(2, "0");
        return `${h}:${m}`;
      },
    });

    // Force the status bar to re-render every tick by re-registering noop.
    const refresh = () => {
      // The plugin manager re-renders subscribers when commands or items
      // change; touching a status item achieves the same. Cheaper alternative:
      // dispatch a window event that StatusBar listens to.
      window.dispatchEvent(new CustomEvent("plugins:status-tick"));
    };
    listeners.add(refresh);
    api.onDeactivate(() => listeners.delete(refresh));
  },
};

export const BUILTIN_PLUGINS: Plugin[] = [helloWorld, clock, discordRpc];
