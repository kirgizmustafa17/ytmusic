import { useState } from 'react';
import { FaPaste, FaDownload } from 'react-icons/fa';

interface UrlInputProps {
  onDownload: (url: string) => void;
}

export function UrlInput({ onDownload }: UrlInputProps) {
  const [url, setUrl] = useState('');

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
          placeholder="Paste YouTube or playlist URL here..."
          required
        />
        <button type="button" onClick={handlePaste} className="btn-secondary btn-icon" title="Paste from clipboard">
          <FaPaste />
        </button>
        <button type="submit" className="btn-primary flex items-center gap-2">
          <FaDownload /> Download
        </button>
      </form>
    </div>
  );
}
