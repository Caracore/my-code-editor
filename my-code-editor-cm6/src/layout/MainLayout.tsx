import { Suspense, useEffect, useState } from "react";
import TopMenu from "../components/TopMenu/TopMenu";
import Toolbar from "../components/Toolbar/Toolbar";
import Sidebar from "../components/Sidebar/Sidebar";
import TabsBar from "../components/TabsBar/TabsBar";
import SplitTabBar from "../components/TabsBar/SplitTabBar";
import Terminal from "../components/Terminal/TerminalPanel";
import ThemeManager from "../components/ThemeManager/ThemeManager";
import SettingsPanel from "../components/SettingsPanel/SettingsPanel";
import WelcomeScreen from "../components/WelcomeScreen/WelcomeScreen";
import TodoList from "../components/TodoList/TodoList";
import EditorZone from "../components/EditorZone/EditorZone";
import { CommandPalette, type Command } from "../components/CommandPalette/CommandPalette";
import { detectLanguageFromFilename } from "../utils/detectLanguage";
import { useTabs } from "../context/TabsContext";
import { useTheme } from "../context/ThemeContext";
import { useSettingsContext } from "../context/SettingsContext";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useDiscordPresence } from "../hooks/useDiscordPresence";
import { useDiscordUpdate } from "../hooks/useDiscordUpdate";
import { invoke } from "@tauri-apps/api/core";
import type { FileNode } from "../types/FileNode";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { lspManager } from "../lsp";

interface MainLayoutProps {
  tree: FileNode[];
  sidebarVisible: boolean;
  setSidebarVisible: (visible: boolean) => void;
  onRenameFile: (oldPath: string, newName: string) => void;
  onCreateFile: (name: string) => void;
  onOpenFolder: () => void;
  LazyCodeEditor: any;
  onOpenFileFromTree: (path: string) => void;
  toggleFolder: (node: FileNode) => void;
  onCreateFileFromContext: (folder: string, name: string) => void;
  onCreateFolderFromContext: (folder: string, name: string) => void;
  onTrashFile: (path: string) => Promise<boolean>;
  onDeleteFile: (path: string) => Promise<boolean>;
  onReloadTree: () => void;
}

export default function MainLayout({
  tree,
  sidebarVisible,
  setSidebarVisible,
  onRenameFile,
  onCreateFile,
  onOpenFolder,
  LazyCodeEditor,
  onOpenFileFromTree,
  toggleFolder,
  onCreateFileFromContext,
  onCreateFolderFromContext,
  onTrashFile,
  onDeleteFile,
  onReloadTree,
}: MainLayoutProps) {

  const {
    tabs,
    activeTab,
    openTab,
    // setActiveTab,
    // closeTab,
    updateTabContent,
    markTabAsSaved,
  } = useTabs();

  

  // ✅ Utiliser le thème
  const { themeName, setThemeName } = useTheme();

  // ✅ Récupérer les raccourcis, Discord et LSP
  const { shortcuts, discordEnabled, toggleDiscord, lspEnabled, toggleLsp } = useSettingsContext();

  // ✅ Activer les raccourcis clavier
  useKeyboardShortcuts();

  // ✅ Initialiser Discord RPC au démarrage si activé
  useEffect(() => {
    const initDiscord = async () => {
      if (discordEnabled) {
        try {
          await invoke("init_discord_rpc");
          console.log("✅ Discord RPC initialisé");
        } catch (error) {
          console.error("❌ Erreur lors de l'initialisation de Discord RPC:", error);
        }
      }
    };

    initDiscord();
  }, []); // Ne s'exécute qu'une fois au montage

  // ✅ Discord Rich Presence
  const currentTab = tabs.find(tab => tab.path === activeTab);
  const currentFileName = currentTab ? currentTab.path.split(/[\\/]/).pop() || "Untitled" : "No file open";
  const currentLanguage = currentTab ? detectLanguageFromFilename(currentTab.path) : "Text";
  const projectName = tree.length > 0 && tree[0].path ? tree[0].path.split(/[\\/]/).pop() || "My Code Editor" : "My Code Editor";
  
  useDiscordPresence({
    fileName: currentFileName,
    language: currentLanguage,
    projectName: projectName,
    enabled: discordEnabled,
  });

  // 🎮 Discord Update avec throttle lors des modifications de contenu
  useDiscordUpdate({
    fileName: currentFileName,
    language: currentLanguage,
    projectName: projectName,
    enabled: discordEnabled,
    throttleMs: 3000, // Mise à jour max toutes les 3 secondes
  });

  const [showThemeManager, setShowThemeManager] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showTodoList, setShowTodoList] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
  // Gestion du split view
  const [splitMode, setSplitMode] = useState<"none" | "left" | "right">("none");
  const [splitFile, setSplitFile] = useState<{ path: string; content: string; isDirty: boolean; originalContent: string } | null>(null);
  
  // Stocker temporairement le fichier draggé
  const [draggedFilePath, setDraggedFilePath] = useState<string | null>(null);
  
  // Tracker quel éditeur a le focus
  const [focusedEditor, setFocusedEditor] = useState<"main" | "split">("main");
  
  // Fonction pour fermer le split
  const closeSplit = () => {
    console.log("🔄 Fermeture du split");
    setSplitMode("none");
    setSplitFile(null);
  };
  
  // Fonction pour mettre à jour le contenu du split
  const updateSplitContent = (newContent: string) => {
    if (!splitFile) return;
    
    setSplitFile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        content: newContent,
        isDirty: newContent !== prev.originalContent
      };
    });
  };
  
  // Fonction pour sauvegarder le fichier du split
  async function saveSplitFile() {
    if (!splitFile) return;
    
    console.log("💾 Sauvegarde du fichier split:", splitFile.path);
    try {
      await invoke("save_file", { path: splitFile.path, content: splitFile.content });
      // Mettre à jour originalContent pour réinitialiser isDirty
      setSplitFile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          isDirty: false,
          originalContent: prev.content
        };
      });
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde du split:", error);
    }
  }
  
  // Callback pour gérer le drop dans l'EditorZone
  const handleEditorZoneDrop = async (zone: "left" | "right" | "center") => {
    console.log("🎯 Drop dans EditorZone, zone:", zone, "fichier:", draggedFilePath);
    
    if (!draggedFilePath) return;
    
    try {
      // Lire le contenu du fichier
      const content = await invoke<string>("read_file", { path: draggedFilePath });
      
      if (zone === "center") {
        // Ouvrir normalement et fermer le split
        setSplitMode("none");
        setSplitFile(null);
        openTab(draggedFilePath, content);
      } else {
        // Ouvrir en mode split (sans ajouter aux tabs)
        setSplitMode(zone);
        setSplitFile({ 
          path: draggedFilePath, 
          content, 
          isDirty: false,
          originalContent: content 
        });
        // Ne pas ouvrir dans les tabs pour éviter la confusion
      }
    } catch (error) {
      console.error("❌ Erreur lors de la lecture du fichier:", error);
    } finally {
      setDraggedFilePath(null);
    }
  };

  // ✅ Configuration du drag and drop global
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Écouter les événements d'ouverture de fichiers avec zones de split
  useEffect(() => {
    const handleOpenFileInZone = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { path, content, zone } = customEvent.detail;
      
      console.log("🎯 Ouverture fichier dans zone:", zone, path);
      
      if (zone === "center" || !zone) {
        // Ouvrir normalement dans l'onglet principal
        setSplitMode("none");
        setSplitFile(null);
        openTab(path, content);
      } else if (zone === "left" || zone === "right") {
        // Ouvrir en mode split
        setSplitMode(zone);
        setSplitFile({ 
          path, 
          content,
          isDirty: false,
          originalContent: content
        });
        // Ouvrir aussi dans les onglets principaux
        openTab(path, content);
      }
    };
    
    window.addEventListener("open-file-in-zone", handleOpenFileInZone);
    return () => window.removeEventListener("open-file-in-zone", handleOpenFileInZone);
  }, [openTab]);

  // Gérer le début du drag
  const handleGlobalDragStart = (event: any) => {
    const { active } = event;
    const dragData = active.data.current;
    console.log("🚀 Drag START:", { active: active.id, dragData });
  };

  // Gérer le drag and drop global
  const handleGlobalDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log("🎯 Drag END:", { active: active.id, over: over?.id });
    
    if (!over) {
      console.log("⚠️ Pas de cible (over is null)");
      setDraggedFilePath(null);
      return;
    }

    const dragData = active.data.current;
    const dropData = over.data.current;

    console.log("🎯 Drag global détails:", { active: active.id, over: over.id, dragData, dropData });
    
    // Stocker le fichier draggé pour l'EditorZone
    if (dragData?.type === "file") {
      setDraggedFilePath(active.id as string);
    }

    // Type 1: Drag d'un fichier/dossier depuis la sidebar
    if (dragData?.type === "file" || dragData?.type === "folder") {
      const sourcePath = active.id as string;
      
      console.log("📁 Type détecté:", dragData.type, "source:", sourcePath);
      
      // Drop dans la WelcomeScreen = ouvrir le fichier (zone gérée par WelcomeScreen lui-même)
      if (over.id === "welcome-screen" && dragData?.type === "file") {
        console.log("📂 Ouverture du fichier dans WelcomeScreen:", sourcePath);
        onOpenFileFromTree(sourcePath);
        return;
      }
      
      // Drop dans la TabsBar = ouvrir le fichier
      if (over.id === "tabs-bar" && dragData?.type === "file") {
        console.log("📂 Ouverture du fichier dans TabsBar:", sourcePath);
        onOpenFileFromTree(sourcePath);
        return;
      }
      
      // Drop dans l'EditorZone = ouvrir avec détection de zone
      if (over.id === "editor-zone" && dragData?.type === "file") {
        console.log("📂 Drop dans EditorZone");
        const zone = dropData?.getZone?.() || "center";
        console.log("Zone détectée:", zone);
        
        // Appeler directement handleEditorZoneDrop avec la zone
        handleEditorZoneDrop(zone as "left" | "right" | "center");
        return;
      }
      
      // Drop sur un autre fichier/dossier = déplacement
      if (dropData?.type === "file" || dropData?.type === "folder") {
        const targetPath = over.id as string;
        const targetNode = dropData?.node as FileNode;
        console.log("📦 Déplacement de fichier:", sourcePath, "→", targetPath);
        console.log("📦 targetNode:", targetNode);
        console.log("📦 targetIsDir:", targetNode?.isDir);
        
        // Appeler directement le déplacement au lieu de passer par un événement custom
        const fileName = sourcePath.split(/[/\\]/).pop() || "";
        const separator = sourcePath.includes("/") ? "/" : "\\";
        
        let newPath: string;
        if (targetNode?.isDir) {
          // Déposer dans un dossier
          newPath = `${targetPath}${targetPath.endsWith(separator) ? "" : separator}${fileName}`;
        } else {
          // Déposer à côté d'un fichier (même dossier parent)
          const targetParts = targetPath.split(/[/\\]/);
          targetParts.pop();
          const parentPath = targetParts.join(separator);
          newPath = `${parentPath}${separator}${fileName}`;
        }
        
        // Vérifier si la destination est différente
        if (sourcePath === newPath) {
          console.log("⚠️ Le fichier est déjà à cet emplacement");
          return;
        }
        
        console.log(`🔄 Déplacement: ${sourcePath} → ${newPath}`);
        
        invoke("rename_file", { oldPath: sourcePath, newPath })
          .then(() => {
            console.log(`✅ Déplacé avec succès: ${newPath}`);
            console.log(`🔄 Appel de onReloadTree pour rafraîchir l'arbre`);
            onReloadTree();
          })
          .catch((err) => {
            console.error("❌ Erreur lors du déplacement:", err);
            alert(`Erreur lors du déplacement: ${err}`);
          });
        
        return;
      }
      
      console.log("⚠️ Aucune condition de drop satisfaite pour:", { overId: over.id, dropData });
    }

    // Type 2: Réorganisation des onglets (géré par TabsBar avec son propre DndContext)
    if (dragData?.type === "tab") {
      console.log("🗂️ Réorganisation d'onglets (géré par TabsBar)");
      // Laissé à la gestion interne de TabsBar
    }
  };

  // ✅ Ctrl+S → sauvegarde selon le focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        if (focusedEditor === "split" && splitFile) {
          saveSplitFile();
        } else {
          saveActiveFile();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tabs, activeTab, focusedEditor, splitFile]);

  // ✅ Gérer le raccourci Ctrl+Shift+P pour la palette de commandes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ✅ Créer la liste des commandes pour la palette
  const commands: Command[] = [
    { id: 'file:new', label: 'New File', category: 'File', action: 'file:new', shortcut: shortcuts['file:new'], icon: '📄' },
    { id: 'folder:new', label: 'New Folder', category: 'File', action: 'folder:new', shortcut: shortcuts['folder:new'], icon: '📁' },
    { id: 'file:open', label: 'Open Folder...', category: 'File', action: 'file:open', shortcut: shortcuts['file:open'], icon: '📂' },
    { id: 'file:save', label: 'Save', category: 'File', action: 'file:save', shortcut: shortcuts['file:save'], icon: '💾' },
    { id: 'file:saveAs', label: 'Save As...', category: 'File', action: 'file:saveAs', shortcut: shortcuts['file:saveAs'], icon: '💾' },
    { id: 'edit:undo', label: 'Undo', category: 'Edit', action: 'edit:undo', shortcut: shortcuts['edit:undo'], icon: '↶' },
    { id: 'edit:redo', label: 'Redo', category: 'Edit', action: 'edit:redo', shortcut: shortcuts['edit:redo'], icon: '↷' },
    { id: 'edit:copy', label: 'Copy', category: 'Edit', action: 'edit:copy', shortcut: shortcuts['edit:copy'], icon: '📋' },
    { id: 'edit:paste', label: 'Paste', category: 'Edit', action: 'edit:paste', shortcut: shortcuts['edit:paste'], icon: '📋' },
    { id: 'view:toggleSidebar', label: 'Toggle Sidebar', category: 'View', action: 'view:toggleSidebar', shortcut: shortcuts['view:toggleSidebar'], icon: '📑' },
    { id: 'view:toggleTerminal', label: 'Toggle Terminal', category: 'View', action: 'view:toggleTerminal', shortcut: shortcuts['view:toggleTerminal'], icon: '⌨️' },
    { id: 'view:toggleTodoList', label: 'Toggle Todo List', category: 'View', action: 'view:toggleTodoList', shortcut: shortcuts['view:toggleTodoList'], icon: '✓' },
    { id: 'view:themeManager', label: 'Theme Manager', category: 'View', action: 'view:themeManager', shortcut: '', icon: '🎨' },
    { id: 'search:toggle', label: 'Toggle Search', category: 'Search', action: 'search:toggle', shortcut: shortcuts['search:toggle'], icon: '🔍' },
    { id: 'discord:toggle', label: 'Toggle Discord Rich Presence', category: 'Settings', action: 'discord:toggle', shortcut: '', icon: '🎮' },
    { id: 'lsp:toggle', label: `Toggle LSP (${lspEnabled ? 'ON' : 'OFF'})`, category: 'Settings', action: 'lsp:toggle', shortcut: '', icon: '🔧' },
    { id: 'lsp:status', label: 'Check LSP Status', category: 'Settings', action: 'lsp:status', shortcut: '', icon: '📊' },
    { id: 'settings:open', label: 'Open Settings', category: 'Settings', action: 'settings:open', shortcut: 'Ctrl+,', icon: '⚙️' },
  ];

  // ✅ Gérer la sélection d'une commande depuis la palette
  const handleCommandSelect = (action: string) => {
    window.dispatchEvent(new CustomEvent('menu-action', { detail: action }));
  };

  // ✅ Gérer les actions du menu et des raccourcis
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      const action = custom.detail;
      console.log("🔍 Action reçue dans MainLayout:", action);

      switch (action) {
        case "file:save":
          saveActiveFile();
          break;
        case "file:new":
          onCreateFile("nouveau fichier");
          break;
        case "folder:new":
          console.log("TODO: Créer un nouveau dossier");
          break;
        case "file:open":
          onOpenFolder();
          break;
        case "file:saveAs":
          console.log("TODO: Sauvegarder sous...");
          break;
        case "edit:undo":
          document.execCommand('undo');
          break;
        case "edit:redo":
          document.execCommand('redo');
          break;
        case "edit:copy":
          document.execCommand('copy');
          break;
        case "edit:paste":
          document.execCommand('paste');
          break;
        case "view:toggleSidebar":
          setSidebarVisible(!sidebarVisible);
          if (showTodoList) {
            setShowTodoList(false);
          }
          break;
        case "view:toggleTerminal":
          setShowTerminal((v: boolean) => !v);
          break;
        case "view:toggleTodoList":
          console.log("🔍 Toggle TodoList - Current state:", { showTodoList, sidebarVisible });
          if (showTodoList) {
            setShowTodoList(false);
          } else {
            setSidebarVisible(true);
            setShowTodoList(true);
          }
          console.log("🔍 Toggle TodoList - New state:", { showTodoList: !showTodoList, sidebarVisible: true });
          break;
        case "view:themeManager":
          setShowThemeManager((v) => !v);
          break;
        case "settings:open":
          setShowSettings((v) => !v);
          break;
        case "discord:toggle":
          handleDiscordToggle(!discordEnabled);
          break;
        case "lsp:toggle":
          handleLspToggle(!lspEnabled);
          break;
        case "lsp:status":
          checkLspStatus();
          break;
        case "search:toggle":
          // Propager l'événement aux éditeurs
          window.dispatchEvent(new CustomEvent('menu-action', { detail: 'search:toggle' }));
          break;
        default:
          console.log("🔍 Action non gérée:", action);
      }
    };

    window.addEventListener("menu-action", handler as EventListener);
    return () => window.removeEventListener("menu-action", handler as EventListener);
  }, [tabs, activeTab, onCreateFile, onOpenFolder, showTodoList, showTerminal, setSidebarVisible, discordEnabled, toggleDiscord, lspEnabled, toggleLsp]);

  // ✅ Gérer le toggle Discord
  async function handleDiscordToggle(enabled: boolean) {
    try {
      if (enabled) {
        await invoke("init_discord_rpc");
      } else {
        await invoke("disconnect_discord_rpc");
      }
      toggleDiscord(enabled);
      console.log(`${enabled ? "✅" : "❌"} Discord RPC ${enabled ? "activé" : "désactivé"}`);
    } catch (error) {
      console.error("Erreur lors de la configuration de Discord RPC:", error);
    }
  }

  // ✅ Gérer le toggle LSP
  async function handleLspToggle(enabled: boolean) {
    if (enabled) {
      console.log("🔧 LSP activé");
    } else {
      // Stop all LSP servers when disabling
      await lspManager.stopAllServers();
      console.log("🔧 LSP désactivé - Serveurs arrêtés");
    }
    toggleLsp(enabled);
  }

  // ✅ Vérifier le statut des serveurs LSP
  async function checkLspStatus() {
    const languages = ["python", "rust", "typescript", "javascript"];
    console.log("📊 === Statut LSP ===");
    console.log(`LSP activé: ${lspEnabled ? "✅ Oui" : "❌ Non"}`);
    
    for (const lang of languages) {
      const isRunning = lspManager.isServerRunning(lang);
      console.log(`${lang}: ${isRunning ? "🟢 Actif" : "⚪ Inactif"}`);
    }
    
    // Test si les commandes LSP sont disponibles
    try {
      const testResults = await invoke<Record<string, boolean>>("check_lsp_commands");
      console.log("📊 === Serveurs LSP installés ===");
      for (const [cmd, available] of Object.entries(testResults)) {
        console.log(`${cmd}: ${available ? "✅ Installé" : "❌ Non trouvé"}`);
      }
    } catch (error) {
      console.log("⚠️ Impossible de vérifier les serveurs LSP installés");
    }
  }

  // ✅ Sauvegarde
  async function saveActiveFile() {
    if (!activeTab) return;
    const file = tabs.find((t) => t.path === activeTab);
    if (!file) return;

    console.log("💾 Sauvegarde du fichier:", activeTab);
    await invoke("save_file", { path: activeTab, content: file.content });
    markTabAsSaved(activeTab);
    
    // 🎮 Mise à jour Discord Presence après sauvegarde
    if (discordEnabled) {
      try {
        const fileName = activeTab.split(/[\\/]/).pop() || "Untitled";
        const language = detectLanguageFromFilename(activeTab);
        const projectName = tree.length > 0 && tree[0].path ? tree[0].path.split(/[\\/]/).pop() || "My Code Editor" : "My Code Editor";
        
        await invoke("update_discord_presence", {
          payload: {
            file: fileName,
            language: language,
            project: projectName
          }
        });
      } catch (error) {
        console.error("❌ Erreur Discord Presence:", error);
      }
    }
  }
  // Pour choisir le langage de l'éditeur & pour faire fonctionner la tabsbar
  const activeFile = tabs.find((t) => t.path === activeTab);
  
  // Récupérer le chemin racine du projet
  const rootPath = tree.length > 0 && tree[0].path ? tree[0].path : null;

  // Update LSP manager root path when project changes
  useEffect(() => {
    if (rootPath) {
      lspManager.setRootPath(rootPath);
    }
  }, [rootPath]);

  // Cleanup LSP servers on unmount
  useEffect(() => {
    return () => {
      lspManager.stopAllServers();
    };
  }, []);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <TopMenu />

      <Toolbar
        onCreateFile={() => onCreateFile("nouveau fichier")}
        onOpenThemeManager={() => setShowThemeManager((v) => !v)}
        theme={themeName}
        setTheme={setThemeName}
      />

      {showThemeManager && <ThemeManager />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commands}
        onSelectCommand={handleCommandSelect}
      />

      <DndContext 
        sensors={sensors} 
        onDragStart={handleGlobalDragStart} 
        onDragEnd={handleGlobalDragEnd}
      >
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {sidebarVisible && (
          showTodoList ? (
            <TodoList />
          ) : (
            <Sidebar
              tree={tree}
              sidebarVisible={sidebarVisible}
              onRenameFile={onRenameFile}
              onOpenFolder={onOpenFolder}
              onOpenFile={onOpenFileFromTree}
              onToggleFolder={toggleFolder}
              onCreateFile={onCreateFile}
              onCreateFileFromContext={onCreateFileFromContext}
              onCreateFolderFromContext={onCreateFolderFromContext}
              onTrashFile={onTrashFile}
              onDeleteFile={onDeleteFile}
              onReloadTree={onReloadTree}
            />
          )
        )}

        {/* Zone centrale */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, overflow: "hidden", position: "relative", display: "flex" }}>
            {!activeFile ? (
              <WelcomeScreen />
            ) : splitMode !== "none" && splitFile ? (
              // Mode Split: afficher 2 éditeurs côte à côte avec leurs TabsBar
              <>
                {splitMode === "left" && (
                  <div 
                    style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--border-color)" }}
                    onFocus={() => setFocusedEditor("split")}
                  >
                    <SplitTabBar 
                      filePath={splitFile.path} 
                      isDirty={splitFile.isDirty}
                      onClose={closeSplit} 
                    />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <Suspense fallback={<div style={{ color: "white" }}>Chargement...</div>}>
                        <LazyCodeEditor
                          key={splitFile.path}
                          value={splitFile.content}
                          onChange={(newValue: string) => updateSplitContent(newValue)}
                          language={detectLanguageFromFilename(activeFile.name)}
                          filePath={splitFile.path}
                        />
                      </Suspense>
                    </div>
                  </div>
                )}
                
                <div 
                  style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
                  onFocus={() => setFocusedEditor("main")}
                >
                  <TabsBar />
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <Suspense fallback={<div style={{ color: "white" }}>Chargement...</div>}>
                      <LazyCodeEditor
                        key={activeFile.path}
                        value={activeFile.content}
                        onChange={(newValue: string) =>
                          updateTabContent(activeFile.path, newValue)
                        }
                        language={detectLanguageFromFilename(activeFile.name)}
                        filePath={activeFile.path}
                      />
                    </Suspense>
                  </div>
                </div>
                
                {splitMode === "right" && (
                  <div 
                    style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "1px solid var(--border-color)" }}
                    onFocus={() => setFocusedEditor("split")}
                  >
                    <SplitTabBar 
                      filePath={splitFile.path} 
                      isDirty={splitFile.isDirty}
                      onClose={closeSplit} 
                    />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <Suspense fallback={<div style={{ color: "white" }}>Chargement...</div>}>
                        <LazyCodeEditor
                          key={splitFile.path}
                          value={splitFile.content}
                          onChange={(newValue: string) => updateSplitContent(newValue)}
                          language={detectLanguageFromFilename(activeFile.name)}
                          filePath={splitFile.path}
                        />
                      </Suspense>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Mode normal: un seul éditeur avec zone de drop
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <TabsBar />
                <EditorZone onFileDrop={handleEditorZoneDrop}>
                  <Suspense fallback={<div style={{ color: "white" }}>Chargement...</div>}>
                    <LazyCodeEditor
                      key={activeFile.path}
                      value={activeFile.content}
                      onChange={(newValue: string) =>
                        updateTabContent(activeFile.path, newValue)
                      }
                      language={detectLanguageFromFilename(activeFile.name)}
                      filePath={activeFile.path}
                    />
                  </Suspense>
                </EditorZone>
              </div>
            )}
          </div>

          <div style={{
            height: showTerminal ? "200px" : "0", 
            borderTop: showTerminal ? "1px solid #333" : "none",
            overflow: "hidden",
            transition: "height 0.2s ease"
          }}>
            <Terminal rootPath={rootPath} />
          </div>
        </div>
        </div>
      </DndContext>
    </div>
  );
}
