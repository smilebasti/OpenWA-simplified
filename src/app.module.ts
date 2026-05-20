import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { SessionModule } from './modules/session/session.module';
import { MessageModule } from './modules/message/message.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { EngineModule } from './engine/engine.module';
import { LoggerModule } from './common/services/logger.module';
import { SettingsModule } from './modules/settings/settings.module';
import { EventsModule } from './modules/events/events.module';
import { ChannelModule } from './modules/channel/channel.module';
import { CacheModule } from './common/cache';
import { StorageModule } from './common/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Auth/config DB (SQLite, always)
    TypeOrmModule.forRootAsync({
      name: 'main',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite' as const,
        database: configService.get<string>('database.database', './data/main.sqlite'),
        entities: [__dirname + '/modules/auth/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: configService.get<boolean>('database.logging', false),
      }),
    }),

    // Data DB (SQLite only)
    TypeOrmModule.forRootAsync({
      name: 'data',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite' as const,
        database: configService.get<string>('dataDatabase.database', './data/openwa.sqlite'),
        entities: [
          __dirname + '/modules/session/**/*.entity{.ts,.js}',
          __dirname + '/modules/message/**/*.entity{.ts,.js}',
        ],
        synchronize: true,
        logging: configService.get<boolean>('dataDatabase.logging', false),
      }),
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: configService.get<number>('api.rateLimit.shortTtl', 1000),
            limit: configService.get<number>('api.rateLimit.shortLimit', 10),
          },
          {
            name: 'medium',
            ttl: configService.get<number>('api.rateLimit.mediumTtl', 60000),
            limit: configService.get<number>('api.rateLimit.mediumLimit', 100),
          },
        ],
      }),
    }),

    LoggerModule,
    CacheModule,
    StorageModule,
    EventsModule,
    AuthModule,
    EngineModule,
    SessionModule,
    MessageModule,
    HealthModule,
    SettingsModule,
    ChannelModule,
  ],
})
export class AppModule {}
