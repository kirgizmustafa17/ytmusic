export interface DownloadItem {
  id: string;
  url: string;
  title: string;
  status: 'queued' | 'checking' | 'downloading' | 'converting' | 'completed' | 'error' | 'cancelled';
  percentage: number;
  speed: string;
  eta: string;
  error?: string;
}

export interface BinaryStatus {
  name: string;
  installed: boolean;
}

export interface PlaylistEntry {
  title: string;
  url: string;
}

export interface CheckResult {
  is_playlist: boolean;
  title?: string;
  entries: PlaylistEntry[];
}

export interface ProgressPayload {
  name: string;
  percentage: number;
  downloaded: number;
  total: number;
}

export interface DownloadProgress {
  id: string;
  status: string;
  percentage: number;
  speed: string;
  eta: string;
}
