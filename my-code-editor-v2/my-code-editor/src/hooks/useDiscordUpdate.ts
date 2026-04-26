import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface DiscordUpdateOptions {
  fileName: string;
  language: string;
  projectName: string;
  enabled: boolean;
  throttleMs?: number;
}

/**
 * Hook pour mettre à jour Discord Presence avec un throttle
 * Utilisé pour éviter trop d'appels lors de la modification du contenu
 */
export function useDiscordUpdate({
  fileName,
  language,
  projectName,
  enabled,
  throttleMs = 3000 // 3 secondes par défaut
}: DiscordUpdateOptions) {
  const lastUpdateRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // Si on a déjà fait une mise à jour récemment, on schedule pour plus tard
    if (timeSinceLastUpdate < throttleMs) {
      // Annuler le timeout précédent si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Programmer une mise à jour pour dans X ms
      timeoutRef.current = setTimeout(() => {
        updatePresence();
      }, throttleMs - timeSinceLastUpdate);
    } else {
      // Sinon on met à jour immédiatement
      updatePresence();
    }

    async function updatePresence() {
      try {
        await invoke('update_discord_presence', {
          payload: {
            file: fileName,
            language: language,
            project: projectName
          }
        });
        lastUpdateRef.current = Date.now();
      } catch (error) {
        // Silencieux si Discord n'est pas activé
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fileName, language, projectName, enabled, throttleMs]);
}
