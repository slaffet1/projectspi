// ocr.controller.ts
import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { OcrGroqService } from './ocr.service';


@Controller('ocr')
@UseGuards(AuthGuard('jwt'))
export class OcrController {
  constructor(private readonly ocrService: OcrGroqService) {}

  @Post('extract')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      // ✅ FIX: memoryStorage keeps file in buffer — required for Tesseract
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException(
              'Only image files are accepted (JPEG, PNG, WEBP, etc.)',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async extract(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'No file received. Send the image in a multipart field named "file".',
      );
    }

    try {
      return await this.ocrService.processImage(file);
    } catch (err: any) {
      throw new InternalServerErrorException(
        err?.message ?? 'OCR processing failed',
      );
    }
  }
}