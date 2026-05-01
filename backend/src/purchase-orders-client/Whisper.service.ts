import { Injectable, InternalServerErrorException } from '@nestjs/common';
import FormData from 'form-data';
import axios from 'axios';

@Injectable()
export class WhisperService {
  private readonly apiKey = process.env.API_TRANS;

  async transcribe(file: Express.Multer.File): Promise<string> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('GROQ_API_KEY is not set');
    }

    const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname || 'audio.webm',
      contentType: file.mimetype || 'audio/webm',
    });
    form.append('model', 'whisper-large-v3-turbo'); // gratuit sur Groq
    // Pas de "language" → détection automatique de la langue


// Ajoute ça 👇
form.append('temperature', '0'); // plus précis, moins aléatoire
form.append('response_format', 'json');



    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        form,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            ...form.getHeaders(),
          },
        },
      );
      return response.data.text as string;
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err.message;
      throw new InternalServerErrorException(`Groq Whisper error: ${msg}`);
    }
  }
}