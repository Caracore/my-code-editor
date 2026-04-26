use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};

pub struct DiscordState {
    pub enabled: bool,
    pub client: Option<DiscordIpcClient>,
    app_id: String,
}

impl DiscordState {
    pub fn new(app_id: &str) -> Self {
        println!("[Discord] Creating DiscordState (not connecting yet)");
        
        // Ne pas se connecter automatiquement - attendre init_discord_rpc
        Self {
            enabled: false,
            client: None,
            app_id: app_id.to_string(),
        }
    }

    /// Initialise la connexion Discord (appelé par init_discord_rpc)
    pub fn connect(&mut self) -> Result<(), String> {
        if self.client.is_some() {
            println!("[Discord] Already connected");
            return Ok(());
        }

        println!("[Discord] Attempting to connect with App ID: {}", self.app_id);
        
        let mut client = DiscordIpcClient::new(&self.app_id);
        
        match client.connect() {
            Ok(_) => {
                println!("[Discord] ✅ Connected to Discord IPC");
                self.client = Some(client);
                self.enabled = true;
                Ok(())
            }
            Err(e) => {
                println!("[Discord] ❌ Failed to connect to Discord IPC: {:?}", e);
                Err(format!("Failed to connect to Discord: {:?}", e))
            }
        }
    }

    /// Déconnecte Discord (appelé par disconnect_discord_rpc)
    pub fn disconnect(&mut self) -> Result<(), String> {
        println!("[Discord] Disconnecting...");
        self.enabled = false;
        
        if let Some(mut client) = self.client.take() {
            let _ = client.close();
            println!("[Discord] ✅ Disconnected from Discord IPC");
        }
        
        Ok(())
    }

    pub fn set_enabled(&mut self, on: bool) {
        println!("[Discord] Enabled set to: {}", on);
        self.enabled = on;
    }

    pub fn update(&mut self, file: &str, language: &str, project: &str) {
        println!("[Discord] update() called");
        println!("  file: {}", file);
        println!("  language: {}", language);
        println!("  project: {}", project);

        if !self.enabled {
            println!("[Discord] ❌ Presence disabled, skipping update");
            return;
        }

        if let Some(client) = self.client.as_mut() {
            println!("[Discord] Client exists, sending activity…");

            let details = format!("Édition de {}", file);
            let state = format!("Langage: {}", language);
            let lang_lower = language.to_lowercase();
            
            let activity = activity::Activity::new()
                .details(&details)
                .state(&state)
                .assets(
                    activity::Assets::new()
                        .large_image(&lang_lower)
                        .large_text(project),
                );

            let result = client.set_activity(activity);
            
            println!("[Discord] set_activity result: {:?}", result);
        } else {
            println!("[Discord] ❌ No Discord client available (not connected)");
        }
    }
}

// use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};

// pub struct DiscordState {
//     pub enabled: bool,
//     pub client: Option<DiscordIpcClient>,
// }

// impl DiscordState {
//     pub fn new(app_id: &str) -> Self {
//         let mut client = DiscordIpcClient::new(app_id);
//         let connected = client.connect().is_ok();

//         Self {
//             enabled: true,
//             client: if connected { Some(client) } else { None },
//         }
//     }

//     pub fn set_enabled(&mut self, on: bool) {
//         self.enabled = on;
//     }

//     pub fn update(&mut self, file: &str, language: &str, project: &str) {
//         if !self.enabled {
//             return;
//         }

//         if let Some(client) = self.client.as_mut() {
//             let details = format!("Édition de {}", file);
//             let state = format!("Langage: {}", language);
//             let lang_lower = language.to_lowercase();
            
//             let activity = activity::Activity::new()
//                 .details(&details)
//                 .state(&state)
//                 .assets(
//                     activity::Assets::new()
//                         .large_image(&lang_lower)
//                         .large_text(project),
//                 );

//             let _ = client.set_activity(activity);
//         }
//     }
// }
