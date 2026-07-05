import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { BinaryStatus } from '../types';
import { FaCheckCircle, FaTimesCircle, FaDownload, FaSpinner } from 'react-icons/fa';
import { useI18n } from '../i18n/I18nContext';

interface BinaryManagerProps {
  onComplete: () => void;
}

interface ProgressEventPayload {
  name: string;
  percentage: number;
}

export function BinaryManager({ onComplete }: BinaryManagerProps) {
  const [binaries, setBinaries] = useState<BinaryStatus[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  const checkBinaries = async () => {
    try {
      const status: BinaryStatus[] = await invoke('check_binaries');
      setBinaries(status);
      if (status.every(b => b.installed) && !downloading) {
        onComplete();
      }
    } catch (e: any) {
      setError(e.toString());
    }
  };

  useEffect(() => {
    checkBinaries();
  }, []);

  useEffect(() => {
    let unlisten: UnlistenFn;
    const setupListener = async () => {
      unlisten = await listen<ProgressEventPayload>('download-binary-progress', (event) => {
        const payload = event.payload;
        setProgress(prev => ({
          ...prev,
          [payload.name]: payload.percentage
        }));
      });
    };
    setupListener();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const handleDownloadMissing = async () => {
    setDownloading(true);
    setError(null);
    const missing = binaries.filter(b => !b.installed);
    for (const b of missing) {
      try {
        await invoke('download_binary', { name: b.name });
      } catch (e: any) {
        setError(e.toString());
        setDownloading(false);
        return;
      }
    }
    await checkBinaries();
    setDownloading(false);
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '600px', margin: '10vh auto' }}>
      <h2 className="text-center">{t('binary.title')}</h2>
      <p className="text-secondary text-center mt-2 mb-4">
        {t('binary.desc')}
      </p>
      
      <div className="flex flex-col gap-4 mt-4">
        {binaries.map(b => (
          <div key={b.name} className="download-item">
            <div className="flex justify-between items-center">
              <strong style={{textTransform: 'uppercase'}}>{b.name}</strong>
              {b.installed ? (
                <FaCheckCircle style={{ color: 'var(--success-color)' }} />
              ) : (
                <FaTimesCircle style={{ color: 'var(--error-color)' }} />
              )}
            </div>
            {!b.installed && progress[b.name] !== undefined && (
              <div className="progress-container mt-2">
                <div className="progress-bar" style={{ width: `${progress[b.name]}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 p-4" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error-color)', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <div className="mt-4 flex justify-center">
        {!binaries.every(b => b.installed) && (
          <button 
            className="btn-primary flex items-center gap-2"
            onClick={handleDownloadMissing}
            disabled={downloading}
          >
            {downloading ? <FaSpinner className="fa-spin" /> : <FaDownload />}
            {downloading ? t('binary.btn.downloading') : t('binary.btn.download')}
          </button>
        )}
      </div>
    </div>
  );
}
