import { CheckResult } from '../types';

interface PlaylistDialogProps {
  checkResult: CheckResult;
  onDownloadAll: () => void;
  onDownloadSingle: () => void;
  onCancel: () => void;
}

export function PlaylistDialog({ checkResult, onDownloadAll, onDownloadSingle, onCancel }: PlaylistDialogProps) {
  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content">
        <h2>Playlist Detected</h2>
        <p className="mt-4 text-secondary">
          The URL you provided is a playlist: <strong style={{color: 'white'}}>{checkResult.title || 'Unknown Playlist'}</strong>
          <br/><br/>
          It contains {checkResult.entries.length} videos.
        </p>
        <div className="flex gap-4 mt-4">
          <button className="btn-primary" onClick={onDownloadAll}>
            Download Entire Playlist
          </button>
          <button className="btn-secondary" onClick={onDownloadSingle}>
            Just This Video
          </button>
          <button className="btn-secondary" onClick={onCancel} style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.2)' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
