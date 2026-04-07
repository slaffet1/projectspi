import { Injectable, Logger } from '@nestjs/common';
import { HfInference } from '@huggingface/inference';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private hf = new HfInference(process.env.HF_TOKEN);
  private readonly MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.hf.featureExtraction({
        model: this.MODEL,
        inputs: text,
      });
      const flat = Array.isArray((result as any)[0])
        ? (result as number[][])[0]
        : (result as number[]);
      return flat;
    } catch (err) {
      this.logger.error('Embedding failed', err);
      return [];
    }
  }
}