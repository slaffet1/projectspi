import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';
import * as Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { DeliveryStatus } from '@prisma/client';

@Injectable()
export class TelegramBotService {
    private readonly logger = new Logger(TelegramBotService.name);

    constructor(
        private prisma: PrismaService,

    ) { }

    async processDeliveryNoteImageFromFileId(fileId: string) {
        try {
            const token = process.env.TELEGRAM_BOT_TOKEN;

            // 1️⃣ Get Telegram file URL
            const fileInfo = await axios.get(
                `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
            );
            const filePath = fileInfo.data.result.file_path;
            const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

            console.debug('Downloading image from Telegram...');
            const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');

            // 2️⃣ Preprocess image (grayscale + threshold for better OCR)
            const processedBuffer = await sharp(buffer)
                .grayscale()
                .threshold(150)
                .toBuffer();

            console.debug('Running OCR...');

            // 3️⃣ Directly recognize text using Tesseract.recognize()
            const { data: { text } } = await Tesseract.recognize(processedBuffer, 'eng', {
                logger: (m) => console.debug(`Tesseract: ${m.status} - ${m.progress}`),
                tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT, // optional PSM
            } as any);

            console.debug('OCR TEXT:', text);

            const normalizedText = text.replace(/\s+/g, '').toUpperCase();

            const match = normalizedText.match(
                /\b(?:BL[-_]?QT[-_]?\d{4}-\d{4}-\d{4}|QT[-_]?\d{4}-\d{4}|INV[-_]?\d{4}\.\d{1,3})\b/i
            );

            if (!match) {
                // fallback: show anything that looks like a code
                const possibleMatches = normalizedText.match(/\b[A-Z]{2,3}[-_]?\d{3,}[-.]?\d{0,4}\b/gi);
                console.debug('Possible matches in OCR text:', possibleMatches);
                throw new Error('Delivery Note number not found in image');
            }

            const quoteNumber = match[0];
            this.logger.debug('Quote Number:', quoteNumber);

            // 4️⃣ Find the related quote in the database
            const quote = await this.prisma.quotes.findUnique({
                where: { quote_id: quoteNumber },
                include: { delivery_notes: true },
            });

            if (!quote) {
                this.logger.error('No quote found for number: ' + quoteNumber);
                throw new Error('No quote found for extracted number');
            }

            // 5️⃣ Update the related delivery note
            if (quote.delivery_notes.length === 0) {
                this.logger.error('No delivery note linked to quote: ' + quoteNumber);
                throw new Error('No delivery note linked to this quote');
            }

            const deliveryNote = quote.delivery_notes[0]; // Assuming only one delivery note per quote

            const updatedDeliveryNote = await this.prisma.delivery_notes.update({
                where: { id: deliveryNote.id },
                data: {
                    status: DeliveryStatus.DELIVERED,

                },
            });

            this.logger.debug('Updated Delivery Note:', updatedDeliveryNote);

            return updatedDeliveryNote;

        } catch (error) {
            console.error('Failed to process delivery note image', error);
            throw error;
        }
    }

    async getTelegramFileUrl(fileId: string): Promise<string> {
        try {
            const token = process.env.TELEGRAM_BOT_TOKEN;
            const fileInfoRes = await axios.get(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
            const filePath = fileInfoRes.data.result.file_path;
            return `https://api.telegram.org/file/bot${token}/${filePath}`;
        } catch (error) {
            this.logger.error('Failed to get Telegram file URL', error);
            throw new Error('Cannot retrieve Telegram file URL');
        }
    }
}


