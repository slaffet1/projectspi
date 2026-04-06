import { TelegramBotService } from './../telegram-bot/telegram-bot.service';
import { Controller, Post, Body } from '@nestjs/common';


@Controller('telegram')
export class TelegramController {

    constructor(
        private readonly deliveryProofService: TelegramBotService,
    ) { }

    @Post('webhook')
    async webhook(@Body() body: any) {

        const photo =
            body?.message?.photo?.[
            body.message.photo.length - 1
            ];

        // ignore non-image messages
        if (!photo) {
            return { ok: true };
        }

        await this.deliveryProofService.processDeliveryNoteImageFromFileId(
            photo.file_id,
        );
        console.log('NEW FILE ID:', photo.file_id);
        return { ok: true };
    }
}