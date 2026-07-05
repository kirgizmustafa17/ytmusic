export type Language = 'en' | 'tr';

export const translations = {
  en: {
    // App.tsx
    'app.subtitle': 'Premium YouTube Audio Downloader',
    'app.alert.failed_check': 'Failed to check URL: {{error}}',
    
    // BinaryManager.tsx
    'binary.title': 'Initial Setup',
    'binary.desc': 'Downloading required dependencies (yt-dlp, ffmpeg, deno)...',
    'binary.btn.download': 'Download Missing Binaries',
    'binary.btn.downloading': 'Downloading...',
    
    // UrlInput.tsx
    'input.placeholder': 'Paste YouTube Video or Playlist URL here...',
    'input.download': 'Download',
    'input.downloading': 'Downloading...',
    
    // DownloadQueue.tsx
    'queue.title': 'Downloads',
    
    // DownloadItemComponent.tsx
    'status.queued': 'Queued',
    'status.checking': 'Checking',
    'status.downloading': 'Downloading',
    'status.converting': 'Converting',
    'status.completed': 'Completed',
    'status.error': 'Error',
    'status.cancelled': 'Cancelled',
    'item.eta': 'ETA: {{eta}}',
    
    // PlaylistDialog.tsx
    'dialog.title': 'Mixed URL Detected',
    'dialog.desc_part1': 'The URL you provided contains both a specific video and a playlist:',
    'dialog.unknown_playlist': 'Unknown Playlist',
    'dialog.desc_part2': 'It contains {{count}} videos. What would you like to download?',
    'dialog.btn.all': 'Download Entire Playlist',
    'dialog.btn.single': 'Just This Video',
    'dialog.btn.cancel': 'Cancel',
  },
  tr: {
    // App.tsx
    'app.subtitle': 'Gelişmiş YouTube Ses İndiricisi',
    'app.alert.failed_check': 'URL kontrol edilemedi: {{error}}',
    
    // BinaryManager.tsx
    'binary.title': 'İlk Kurulum',
    'binary.desc': 'Gerekli bağımlılıklar indiriliyor (yt-dlp, ffmpeg, deno)...',
    'binary.btn.download': 'Eksik Dosyaları İndir',
    'binary.btn.downloading': 'İndiriliyor...',
    
    // UrlInput.tsx
    'input.placeholder': 'YouTube Video veya Oynatma Listesi bağlantısını buraya yapıştırın...',
    'input.download': 'İndir',
    'input.downloading': 'İndiriliyor...',
    
    // DownloadQueue.tsx
    'queue.title': 'İndirmeler',
    
    // DownloadItemComponent.tsx
    'status.queued': 'Kuyrukta',
    'status.checking': 'Kontrol Ediliyor',
    'status.downloading': 'İndiriliyor',
    'status.converting': 'Dönüştürülüyor',
    'status.completed': 'Tamamlandı',
    'status.error': 'Hata',
    'status.cancelled': 'İptal Edildi',
    'item.eta': 'Kalan: {{eta}}',
    
    // PlaylistDialog.tsx
    'dialog.title': 'Karışık Bağlantı Algılandı',
    'dialog.desc_part1': 'Girdiğiniz bağlantı hem belirli bir video hem de bir oynatma listesi içeriyor:',
    'dialog.unknown_playlist': 'Bilinmeyen Liste',
    'dialog.desc_part2': 'Listede {{count}} video var. Hangisini indirmek istersiniz?',
    'dialog.btn.all': 'Tüm Listeyi İndir',
    'dialog.btn.single': 'Sadece Bu Videoyu',
    'dialog.btn.cancel': 'İptal',
  }
};

export type TranslationKey = keyof typeof translations.en;
