import { DownloadItem } from '../types';
import { DownloadItemComponent } from './DownloadItemComponent';

interface DownloadQueueProps {
  items: DownloadItem[];
}

export function DownloadQueue({ items }: DownloadQueueProps) {
  if (items.length === 0) return null;

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <h3 style={{ marginBottom: '1rem' }}>Downloads</h3>
      <div className="flex flex-col" style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
        {items.map(item => (
          <DownloadItemComponent key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
