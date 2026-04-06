import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot/telegram-bot.service';
import { TelegramController } from './telegram/telegram.controller';

@Module({
  providers: [TelegramBotService],
  controllers: [TelegramController]
})
export class TelegramModule {}
