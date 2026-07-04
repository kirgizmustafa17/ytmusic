use tauri::{AppHandle, Manager, Emitter};
use std::path::PathBuf;
use std::fs;
use std::io::Write;
use reqwest::Client;
use futures_util::StreamExt;

#[derive(Clone, serde::Serialize)]
pub struct ProgressPayload {
    pub name: String,
    pub percentage: f64,
    pub downloaded: u64,
    pub total: u64,
}

#[derive(serde::Serialize)]
pub struct BinaryStatus {
    pub name: String,
    pub installed: bool,
}

pub fn get_binary_dir(app: &AppHandle) -> PathBuf {
    let app_data = app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("."));
    let binary_dir = app_data.join("binary");
    if !binary_dir.exists() {
        fs::create_dir_all(&binary_dir).ok();
    }
    binary_dir
}

#[tauri::command]
pub fn check_binaries(app: AppHandle) -> Vec<BinaryStatus> {
    let dir = get_binary_dir(&app);
    let binaries = vec!["yt-dlp", "ffmpeg", "deno"];
    
    binaries.into_iter().map(|name| {
        let exe_name = if cfg!(target_os = "windows") {
            format!("{}.exe", name)
        } else {
            name.to_string()
        };
        let path = dir.join(&exe_name);
        BinaryStatus {
            name: name.to_string(),
            installed: path.exists(),
        }
    }).collect()
}

#[tauri::command]
pub async fn download_binary(app: AppHandle, name: String) -> Result<(), String> {
    let dir = get_binary_dir(&app);
    let os = if cfg!(target_os = "windows") { "windows" } else { "linux" };
    
    let url = match (name.as_str(), os) {
        ("yt-dlp", "windows") => "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe",
        ("yt-dlp", "linux") => "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp",
        ("deno", "windows") => "https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip",
        ("deno", "linux") => "https://github.com/denoland/deno/releases/latest/download/deno-x86_64-unknown-linux-gnu.zip",
        ("ffmpeg", "windows") => "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip",
        ("ffmpeg", "linux") => "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz",
        _ => return Err("Unsupported binary or OS".to_string()),
    };

    let client = Client::builder()
        .user_agent("ytmusic-downloader/1.0")
        .build()
        .map_err(|e| e.to_string())?;
        
    let res = client.get(url).send().await.map_err(|e| e.to_string())?;
    
    if !res.status().is_success() {
        return Err(format!("Failed to download {}: {}", name, res.status()));
    }

    let total_size = res.content_length().unwrap_or(0);
    let mut stream = res.bytes_stream();
    
    let temp_file_path = dir.join(format!("{}.download", name));
    let mut file = fs::File::create(&temp_file_path).map_err(|e| e.to_string())?;

    let mut downloaded: u64 = 0;
    while let Some(chunk_res) = stream.next().await {
        let chunk = chunk_res.map_err(|e| e.to_string())?;
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;
        
        let percentage = if total_size > 0 {
            (downloaded as f64 / total_size as f64) * 100.0
        } else {
            0.0
        };

        app.emit("download-binary-progress", ProgressPayload {
            name: name.clone(),
            percentage,
            downloaded,
            total: total_size,
        }).unwrap_or(());
    }

    match name.as_str() {
        "yt-dlp" => {
            let final_name = if os == "windows" { "yt-dlp.exe" } else { "yt-dlp" };
            let final_path = dir.join(final_name);
            fs::rename(&temp_file_path, &final_path).map_err(|e| e.to_string())?;
            
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let mut perms = fs::metadata(&final_path).unwrap().permissions();
                perms.set_mode(0o755);
                fs::set_permissions(&final_path, perms).unwrap();
            }
        },
        "deno" => {
            let final_name = if os == "windows" { "deno.exe" } else { "deno" };
            extract_zip_single_file(&temp_file_path, &dir.join(final_name), final_name)?;
            fs::remove_file(&temp_file_path).ok();
            
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let mut perms = fs::metadata(&dir.join(final_name)).unwrap().permissions();
                perms.set_mode(0o755);
                fs::set_permissions(&dir.join(final_name), perms).unwrap();
            }
        },
        "ffmpeg" => {
            let final_name = if os == "windows" { "ffmpeg.exe" } else { "ffmpeg" };
            if os == "windows" {
                extract_zip_ffmpeg(&temp_file_path, &dir.join(final_name))?;
            } else {
                extract_tar_xz_ffmpeg(&temp_file_path, &dir.join(final_name))?;
            }
            fs::remove_file(&temp_file_path).ok();
            
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let mut perms = fs::metadata(&dir.join(final_name)).unwrap().permissions();
                perms.set_mode(0o755);
                fs::set_permissions(&dir.join(final_name), perms).unwrap();
            }
        },
        _ => {}
    }

    app.emit("download-binary-progress", ProgressPayload {
        name: name.clone(),
        percentage: 100.0,
        downloaded: total_size,
        total: total_size,
    }).unwrap_or(());

    Ok(())
}

fn extract_zip_single_file(zip_path: &PathBuf, out_path: &PathBuf, target_name: &str) -> Result<(), String> {
    let file = fs::File::open(zip_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
    
    for i in 0..archive.len() {
        let mut f = archive.by_index(i).unwrap();
        if f.name().ends_with(target_name) {
            let mut out = fs::File::create(out_path).map_err(|e| e.to_string())?;
            std::io::copy(&mut f, &mut out).map_err(|e| e.to_string())?;
            return Ok(());
        }
    }
    Err("File not found in zip".to_string())
}

fn extract_zip_ffmpeg(zip_path: &PathBuf, out_path: &PathBuf) -> Result<(), String> {
    let file = fs::File::open(zip_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
    
    for i in 0..archive.len() {
        let mut f = archive.by_index(i).unwrap();
        if f.name().ends_with("bin/ffmpeg.exe") {
            let mut out = fs::File::create(out_path).map_err(|e| e.to_string())?;
            std::io::copy(&mut f, &mut out).map_err(|e| e.to_string())?;
            return Ok(());
        }
    }
    Err("ffmpeg.exe not found in zip".to_string())
}

fn extract_tar_xz_ffmpeg(tar_path: &PathBuf, out_path: &PathBuf) -> Result<(), String> {
    let file = fs::File::open(tar_path).map_err(|e| e.to_string())?;
    let xz = xz2::read::XzDecoder::new(file);
    let mut archive = tar::Archive::new(xz);
    
    for entry in archive.entries().map_err(|e| e.to_string())? {
        let mut entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path().map_err(|e| e.to_string())?.to_path_buf();
        
        if path.to_string_lossy().ends_with("bin/ffmpeg") {
            let mut out = fs::File::create(out_path).map_err(|e| e.to_string())?;
            std::io::copy(&mut entry, &mut out).map_err(|e| e.to_string())?;
            return Ok(());
        }
    }
    Err("ffmpeg not found in tar.xz".to_string())
}
