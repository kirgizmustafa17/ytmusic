import { useState } from 'react';
import { FaPaste, FaDownload } from 'react-icons/fa';
import { useI18n } from '../i18n/I18nContext';

interface UrlInputProps {
  onDownload: (url: string) => void;
}

export function UrlInput({ onDownload }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onDownload(url.trim());
      setUrl('');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  return (
    <div className="glass-panel">
      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t('input.placeholder')}
          required
        />
        <button type="button" onClick={handlePaste} className="btn-secondary btn-icon" title="Paste from clipboard">
          <FaPaste />
        </button>
        <button type="submit" className="btn-primary flex items-center gap-2">
          <FaDownload /> {t('input.download')}
        </button>
      </form>
    </div>
  );
}
