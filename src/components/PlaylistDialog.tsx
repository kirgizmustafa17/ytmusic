import { CheckResult } from '../types';
import { useI18n } from '../i18n/I18nContext';

interface PlaylistDialogProps {
  checkResult: CheckResult;
  onDownloadAll: () => void;
  onDownloadSingle: () => void;
  onCancel: () => void;
}

export function PlaylistDialog({ checkResult, onDownloadAll, onDownloadSingle, onCancel }: PlaylistDialogProps) {
  const { t } = useI18n();

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content">
        <h2>{t('dialog.title')}</h2>
        <p className="mt-4 text-secondary">
          {t('dialog.desc_part1')} <strong style={{color: 'white'}}>{checkResult.title || t('dialog.unknown_playlist')}</strong>
          <br/><br/>
          {t('dialog.desc_part2', { count: checkResult.entries.length })}
        </p>
        <div className="flex gap-4 mt-4">
          <button className="btn-primary" onClick={onDownloadAll}>
            {t('dialog.btn.all')}
          </button>
          <button className="btn-secondary" onClick={onDownloadSingle}>
            {t('dialog.btn.single')}
          </button>
          <button className="btn-secondary" onClick={onCancel} style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.2)' }}>
            {t('dialog.btn.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
