import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../services/logger.service';

@Injectable()
export class StorageService {
  private readonly logger = createLogger('StorageService');
  private readonly localPath: string;

  constructor(private readonly configService: ConfigService) {
    this.localPath = this.configService.get<string>('storage.localPath') || './data/media';

    if (!fs.existsSync(this.localPath)) {
      fs.mkdirSync(this.localPath, { recursive: true });
    }
  }

  listFiles(dir = ''): string[] {
    const fullPath = path.join(this.localPath, dir);
    const files: string[] = [];

    if (!fs.existsSync(fullPath)) return files;

    for (const entry of fs.readdirSync(fullPath, { withFileTypes: true })) {
      const relative = dir ? path.join(dir, entry.name) : entry.name;
      if (entry.isDirectory()) {
        files.push(...this.listFiles(relative));
      } else if (entry.isFile()) {
        files.push(relative);
      }
    }

    return files;
  }

  getFile(filePath: string): Buffer {
    return fs.readFileSync(path.join(this.localPath, filePath));
  }

  putFile(filePath: string, data: Buffer): void {
    const fullPath = path.join(this.localPath, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, data);
  }

  getFileCount(): { count: number; sizeBytes: number } {
    const files = this.listFiles();
    let sizeBytes = 0;
    for (const file of files) {
      try {
        sizeBytes += fs.statSync(path.join(this.localPath, file)).size;
      } catch {
        this.logger.debug(`Failed to stat file: ${file}`);
      }
    }
    return { count: files.length, sizeBytes };
  }
}
