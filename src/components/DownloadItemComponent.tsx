import { DownloadItem } from '../types';
import { FaCheck, FaSpinner, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { useI18n } from '../i18n/I18nContext';
import { TranslationKey } from '../i18n/index';

export function DownloadItemComponent({ item }: { item: DownloadItem }) {
  const { t } = useI18n();
  const isComplete = item.status === 'completed';
  const isError = item.status === 'error';
  
  const statusKey = `status.${item.status}` as TranslationKey;
  
  return (
    <div className="download-item">
      <div className="flex justify-between items-center">
        <strong style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title || item.url}
        </strong>
        <div className="flex items-center gap-2">
          {item.playlist_count && item.playlist_count > 1 && item.playlist_index && (
            <span className="text-sm text-secondary mr-2 font-mono">
              {item.playlist_index}/{item.playlist_count}
            </span>
          )}
          {(item.status === 'downloading' || item.status === 'converting' || item.status === 'checking') ? <FaSpinner className="fa-spin" /> : null}
          {isComplete && <FaCheck style={{ color: 'var(--success-color)' }} />}
          {isError && <FaExclamationTriangle style={{ color: 'var(--error-color)' }} />}
          {item.status === 'cancelled' && <FaTimes />}
          <span className="text-sm">
            {t(statusKey)}
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
            <span>{item.eta ? t('item.eta', { eta: item.eta }) : ''}</span>
          </div>
        </>
      )}
    </div>
  );
}
