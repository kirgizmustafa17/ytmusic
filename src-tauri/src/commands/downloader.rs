use tauri::{AppHandle, Manager, Emitter};
use std::process::Stdio;
use tokio::process::Command;
use tokio::io::{AsyncBufReadExt, BufReader};
use std::path::PathBuf;

#[cfg(windows)]
use std::os::windows::process::CommandExt;
use crate::commands::binary_manager::get_binary_dir;

#[derive(serde::Serialize)]
pub struct PlaylistEntry {
    pub title: String,
    pub url: String,
}

#[derive(serde::Serialize)]
pub struct CheckResult {
    pub is_playlist: bool,
    pub title: Option<String>,
    pub entries: Vec<PlaylistEntry>,
}

#[derive(serde::Serialize, Clone)]
pub struct DownloadProgress {
    pub id: String,
    pub status: String,
    pub percentage: f64,
    pub speed: String,
    pub eta: String,
    pub playlist_index: Option<u32>,
    pub playlist_count: Option<u32>,
}

fn get_ytdlp_path(app: &AppHandle) -> PathBuf {
    let dir = get_binary_dir(app);
    let name = if cfg!(target_os = "windows") { "yt-dlp.exe" } else { "yt-dlp" };
    dir.join(name)
}

fn get_ffmpeg_dir(app: &AppHandle) -> PathBuf {
    get_binary_dir(app)
}

#[tauri::command]
pub async fn check_url(app: AppHandle, url: String) -> Result<CheckResult, String> {
    let ytdlp_path = get_ytdlp_path(&app);
    if !ytdlp_path.exists() {
        return Err("yt-dlp binary not found".to_string());
    }

    let mut cmd = Command::new(&ytdlp_path);
    
    #[cfg(windows)]
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW

    let output = cmd
        .arg("--flat-playlist")
        .arg("--dump-single-json")
        .arg(&url)
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    let parsed: serde_json::Value = serde_json::from_str(&json_str).map_err(|e| e.to_string())?;

    let is_playlist = parsed.get("_type").and_then(|v| v.as_str()) == Some("playlist");
    let title = parsed.get("title").and_then(|v| v.as_str()).map(|s| s.to_string());

    let mut entries = Vec::new();
    if is_playlist {
        if let Some(entries_array) = parsed.get("entries").and_then(|v| v.as_array()) {
            for entry in entries_array {
                let entry_title = entry.get("title").and_then(|v| v.as_str()).unwrap_or("Unknown").to_string();
                let entry_url = entry.get("url").and_then(|v| v.as_str()).unwrap_or("").to_string();
                entries.push(PlaylistEntry {
                    title: entry_title,
                    url: entry_url,
                });
            }
        }
    }

    Ok(CheckResult {
        is_playlist,
        title,
        entries,
    })
}

#[tauri::command]
pub async fn start_download(
    app: AppHandle, 
    url: String, 
    download_id: String,
    playlist_folder: Option<String>,
) -> Result<(), String> {
    let ytdlp_path = get_ytdlp_path(&app);
    let ffmpeg_dir = get_ffmpeg_dir(&app);
    
    // We will save to ~/Music
    let music_dir = dirs::audio_dir().unwrap_or_else(|| dirs::home_dir().unwrap_or_else(|| PathBuf::from(".")));
    let mut out_dir = music_dir;
    if let Some(folder) = playlist_folder {
        let sanitized = folder.replace(|c: char| !c.is_alphanumeric() && c != ' ' && c != '-', "_");
        out_dir = out_dir.join(sanitized);
    }
    let output_template = out_dir.join("%(title)s.%(ext)s").to_string_lossy().to_string();

    let mut cmd = Command::new(&ytdlp_path);
    
    #[cfg(windows)]
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW

    cmd.arg("--newline")
       .arg("--progress-template")
       .arg("%(progress)j")
       .arg("--extract-audio")
       .arg("--audio-format")
       .arg("mp3")
       .arg("--audio-quality")
       .arg("320K")
       .arg("--embed-thumbnail")
       .arg("--ffmpeg-location")
       .arg(&ffmpeg_dir)
       .arg("-o")
       .arg(&output_template)
       .arg(&url)
       .stdout(Stdio::piped())
       .stderr(Stdio::piped());

    let mut child = cmd.spawn().map_err(|e| e.to_string())?;
    
    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let mut reader = BufReader::new(stdout).lines();

    let id_clone = download_id.clone();
    let app_clone = app.clone();

    tokio::spawn(async move {
        let mut current_item: Option<u32> = None;
        let mut total_items: Option<u32> = None;

        while let Ok(Some(line)) = reader.next_line().await {
            if line.starts_with("[download] Downloading item ") || line.starts_with("[download] Downloading video ") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                // [download] Downloading video 1 of 3
                if parts.len() >= 6 {
                    current_item = parts[3].parse().ok().or(current_item);
                    total_items = parts[5].parse().ok().or(total_items);
                }
            } else if let Ok(progress) = serde_json::from_str::<serde_json::Value>(&line) {
                if let Some(percent_str) = progress.get("_percent_str").and_then(|v| v.as_str()) {
                    let cleaned = percent_str.replace("%", "").trim().to_string();
                    let percentage: f64 = cleaned.parse().unwrap_or(0.0);
                    
                    let speed = progress.get("_speed_str").and_then(|v| v.as_str()).unwrap_or("~").trim().to_string();
                    let eta = progress.get("_eta_str").and_then(|v| v.as_str()).unwrap_or("~").trim().to_string();

                    app_clone.emit("download-progress", DownloadProgress {
                        id: id_clone.clone(),
                        status: "downloading".to_string(),
                        percentage,
                        speed,
                        eta,
                        playlist_index: current_item,
                        playlist_count: total_items,
                    }).unwrap_or(());
                }
            } else if line.contains("[ExtractAudio]") || line.contains("[Merger]") {
                app_clone.emit("download-progress", DownloadProgress {
                    id: id_clone.clone(),
                    status: "converting".to_string(),
                    percentage: 100.0,
                    speed: "".to_string(),
                    eta: "".to_string(),
                    playlist_index: current_item,
                    playlist_count: total_items,
                }).unwrap_or(());
            }
        }
        
        let status = child.wait().await;
        if let Ok(exit_status) = status {
            if exit_status.success() {
                app_clone.emit("download-progress", DownloadProgress {
                    id: id_clone.clone(),
                    status: "completed".to_string(),
                    percentage: 100.0,
                    speed: "".to_string(),
                    eta: "".to_string(),
                    playlist_index: current_item,
                    playlist_count: total_items,
                }).unwrap_or(());
            } else {
                app_clone.emit("download-progress", DownloadProgress {
                    id: id_clone.clone(),
                    status: "error".to_string(),
                    percentage: 0.0,
                    speed: "".to_string(),
                    eta: "".to_string(),
                    playlist_index: current_item,
                    playlist_count: total_items,
                }).unwrap_or(());
            }
        }
    });

    Ok(())
}
