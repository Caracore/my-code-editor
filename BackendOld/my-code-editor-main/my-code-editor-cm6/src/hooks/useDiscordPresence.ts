import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef } from "react";

interface UseDiscordPresenceProps {
  fileName?: string;
  language?: string;
  projectName?: string;
  enabled: boolean;
}

export function useDiscordPresence({ 
  fileName = "Untitled", 
  language = "Text", 
  projectName = "My Code Editor",
  enabled 
}: UseDiscordPresenceProps) {
  const lastUpdateRef = useRef({ fileName, language, projectName });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const updatePresence = async () => {
      try {
        // Ne mettre à jour que si quelque chose a changé
        if (
          lastUpdateRef.current.fileName !== fileName ||
          lastUpdateRef.current.language !== language ||
          lastUpdateRef.current.projectName !== projectName
        ) {
          await invoke("update_discord_presence", {
            file: fileName,
            language: language,
            project: projectName,
          });

          lastUpdateRef.current = { fileName, language, projectName };
          console.log("🎮 Discord Presence mise à jour:", { fileName, language, projectName });
        }
      } catch (error) {
        console.error("❌ Erreur lors de la mise à jour de Discord Presence:", error);
        console.error("Détails:", error);
      }
    };

    updatePresence();
  }, [fileName, language, projectName, enabled]);
}

export default useDiscordPresence;
