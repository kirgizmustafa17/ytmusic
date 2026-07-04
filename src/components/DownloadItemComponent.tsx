import { DownloadItem } from '../types';
import { FaCheck, FaSpinner, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

export function DownloadItemComponent({ item }: { item: DownloadItem }) {
  const isComplete = item.status === 'completed';
  const isError = item.status === 'error';
  
  return (
    <div className="download-item">
      <div className="flex justify-between items-center">
        <strong style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title || item.url}
        </strong>
        <div className="flex items-center gap-2">
          {item.status === 'downloading' || item.status === 'converting' ? <FaSpinner className="fa-spin" /> : null}
          {isComplete && <FaCheck style={{ color: 'var(--success-color)' }} />}
          {isError && <FaExclamationTriangle style={{ color: 'var(--error-color)' }} />}
          {item.status === 'cancelled' && <FaTimes />}
          <span className="text-sm" style={{ textTransform: 'capitalize' }}>
            {item.status}
          </span>
        </div>
      </div>
      
      {(!isComplete && !isError && item.status !== 'cancelled') && (
        <>
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${Math.max(0, Math.min(100, item.percentage))}%` }} 
            />
          </div>
          <div className="download-meta mt-2">
            <span>{item.speed || '--'}</span>
            <span>{item.eta ? `ETA: ${item.eta}` : ''}</span>
          </div>
        </>
      )}
    </div>
  );
}
