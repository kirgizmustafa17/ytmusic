import { DownloadItem } from '../types';
import { DownloadItemComponent } from './DownloadItemComponent';

interface DownloadQueueProps {
  items: DownloadItem[];
}

export function DownloadQueue({ items }: DownloadQueueProps) {
  if (items.length === 0) return null;

  return (
    <div className="glass-panel">
      <h3 style={{ marginBottom: '1rem' }}>Downloads</h3>
      <div className="flex flex-col">
        {items.map(item => (
          <DownloadItemComponent key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
