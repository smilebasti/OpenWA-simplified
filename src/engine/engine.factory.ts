import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IWhatsAppEngine } from './interfaces/whatsapp-engine.interface';
import { WhatsAppWebJsAdapter } from './adapters/whatsapp-web-js.adapter';
import { createLogger } from '../common/services/logger.service';

export interface EngineCreateOptions {
  sessionId: string;
  proxyUrl?: string;
  proxyType?: 'http' | 'https' | 'socks4' | 'socks5';
}

@Injectable()
export class EngineFactory {
  private readonly logger = createLogger('EngineFactory');

  constructor(private readonly configService: ConfigService) {}

  create(options: EngineCreateOptions): IWhatsAppEngine {
    this.logger.log(`Creating WhatsApp engine for session: ${options.sessionId}`);

    return new WhatsAppWebJsAdapter({
      sessionId: options.sessionId,
      sessionDataPath: this.configService.get<string>('engine.sessionDataPath') ?? './data/sessions',
      puppeteer: {
        headless: this.configService.get<boolean>('engine.puppeteer.headless') ?? true,
        args: this.configService.get<string[]>('engine.puppeteer.args') ?? [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      },
      proxy: options.proxyUrl ? { url: options.proxyUrl, type: options.proxyType ?? 'http' } : undefined,
    });
  }
}
