import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { UrlInput } from "./components/UrlInput";
import { DownloadQueue } from "./components/DownloadQueue";
import { BinaryManager } from "./components/BinaryManager";
import TitleBar from "./components/TitleBar";
import { PlaylistDialog } from "./components/PlaylistDialog";
import { DownloadItem, CheckResult, DownloadProgress } from "./types";
import { FaMusic } from "react-icons/fa";
import { useI18n } from "./i18n/I18nContext";
import "./App.css";

function App() {
  const [setupComplete, setSetupComplete] = useState(false);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [playlistCheck, setPlaylistCheck] = useState<CheckResult | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const { t } = useI18n();

  const downloadsRef = useRef(downloads);
  useEffect(() => {
    downloadsRef.current = downloads;
  }, [downloads]);

  useEffect(() => {
    let unlisten: UnlistenFn;
    const setupListener = async () => {
      unlisten = await listen<DownloadProgress>("download-progress", (event) => {
        const payload = event.payload;
        setDownloads((prev) =>
          prev.map((item) =>
            item.id === payload.id
              ? {
                  ...item,
                  status: payload.status as any,
                  percentage: payload.percentage,
                  speed: payload.speed,
                  eta: payload.eta,
                  playlist_index: payload.playlist_index,
                  playlist_count: payload.playlist_count,
                }
              : item
          )
        );
      });
    };
    setupListener();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const handleDownload = async (url: string) => {
    try {
      const isMixed = url.includes('v=') && url.includes('list=');
      const result: CheckResult = await invoke("check_url", { url });
      
      if (result.is_playlist) {
        if (!isMixed) {
          // Pure playlist, skip dialog
          const folder = result.title || "Playlist";
          startSingleDownload(url, result.title || url, folder);
        } else {
          // Mixed URL, let user choose
          setPlaylistCheck(result);
          setCurrentUrl(url);
        }
      } else {
        startSingleDownload(url, result.title || url);
      }
    } catch (e: any) {
      alert(t('app.alert.failed_check', { error: String(e) }));
    }
  };

  const startSingleDownload = (url: string, title: string, playlistFolder?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    setDownloads((prev) => [
      {
        id,
        url,
        title,
        status: "queued",
        percentage: 0,
        speed: "",
        eta: "",
      },
      ...prev,
    ]);

    invoke("start_download", { url, downloadId: id, playlistFolder }).catch((e) => {
      setDownloads((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "error", error: String(e) } : item
        )
      );
    });
  };

  const handleDownloadAll = () => {
    if (!playlistCheck || !currentUrl) return;
    const folder = playlistCheck.title || "Playlist";
    startSingleDownload(currentUrl, playlistCheck.title || currentUrl, folder);
    setPlaylistCheck(null);
    setCurrentUrl(null);
  };

  const handleDownloadSingle = () => {
    if (!currentUrl || !playlistCheck) return;
    if (playlistCheck.entries.length > 0) {
       startSingleDownload(playlistCheck.entries[0].url, playlistCheck.entries[0].title);
    } else {
       startSingleDownload(currentUrl, playlistCheck.title || currentUrl);
    }
    
    setPlaylistCheck(null);
    setCurrentUrl(null);
  };

  if (!setupComplete) {
    return <BinaryManager onComplete={() => setSetupComplete(true)} />;
  }

  return (
    <>
      <TitleBar />
      <div className="app-container">
      <header className="header">
        <h1 className="flex items-center justify-center gap-4">
          <FaMusic /> YTMusic
        </h1>
        <p className="text-secondary mt-2">{t('app.subtitle')}</p>
      </header>

      <UrlInput onDownload={handleDownload} />
      <DownloadQueue items={downloads} />

      {playlistCheck && (
        <PlaylistDialog
          checkResult={playlistCheck}
          onDownloadAll={handleDownloadAll}
          onDownloadSingle={handleDownloadSingle}
          onCancel={() => {
            setPlaylistCheck(null);
            setCurrentUrl(null);
          }}
        />
      )}
      </div>
    </>
  );
}

export default App;
