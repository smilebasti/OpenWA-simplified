import { Injectable } from '@nestjs/common';

export interface SessionInfo {
  id: string;
  name: string;
  status: string;
  phone?: string;
  pushName?: string;
  connectedAt?: string;
}

export interface SessionStats {
  active: number;
  total: number;
  byStatus: Record<string, number>;
}

// Redis removed — project uses SQLite + local storage only.
// All methods are intentional no-ops; callers handle null returns gracefully.
@Injectable()
export class CacheService {
  async isAvailable(): Promise<boolean> { return false; }

  async getSessionStatus(_id: string): Promise<string | null> { return null; }
  async setSessionStatus(_id: string, _status: string): Promise<void> {}

  async getSessionInfo(_id: string): Promise<SessionInfo | null> { return null; }
  async setSessionInfo(_id: string, _info: SessionInfo): Promise<void> {}

  async getSessionQR(_id: string): Promise<string | null> { return null; }
  async setSessionQR(_id: string, _qr: string): Promise<void> {}

  async getSessionsList(): Promise<string[] | null> { return null; }
  async setSessionsList(_ids: string[]): Promise<void> {}

  async getSessionsStats(): Promise<SessionStats | null> { return null; }
  async setSessionsStats(_stats: SessionStats): Promise<void> {}

  async invalidateSession(_id: string): Promise<void> {}
  async invalidateSessionsList(): Promise<void> {}
  async invalidateAll(): Promise<void> {}
}
