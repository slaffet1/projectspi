// ocr.service.ts  — no changes needed, keeping as-is for reference
// Make sure your .env contains:
//   API_TRANS=gsk_xxxxxxxxxxxxxxxxxxxx   ← your Groq API key

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Groq from 'groq-sdk';
import * as Tesseract from 'tesseract.js';

export interface PaymentOcrResult {
  payment_method: 'cheque' | 'espece' | 'virement' | 'other' | '';
  payment_date: string;   // "YYYY-MM-DD" or ""
  amount: string;         // numeric string, digits only, or ""
  reference: string;
  cheque_number: string;
  bank_name: string;
  notes: string;
}

@Injectable()
export class OcrGroqService {
  private readonly client = new Groq({
    apiKey: process.env.API_TRANS, // your .env key
  });

  async imageToText(file: Express.Multer.File): Promise<string> {
    try {
      // ✅ file.buffer works because we use memoryStorage() in the controller
      const { data } = await Tesseract.recognize(file.buffer, 'eng+fra');
      return data.text ?? '';
    } catch (err: any) {
      throw new InternalServerErrorException(
        `Tesseract OCR failed: ${err?.message ?? String(err)}`,
      );
    }
  }

  async extractPaymentData(text: string): Promise<PaymentOcrResult> {
    const prompt = `
You are a financial document parser. Extract payment information from the text below.

Return ONLY a valid JSON object with these exact keys (use empty string "" if not found):
{
  "payment_method": "cheque" | "espece" | "virement" | "other",
  "payment_date": "YYYY-MM-DD",
  "amount": "number as string, digits only",
  "reference": "transaction reference or empty string",
  "cheque_number": "cheque number or empty string",
  "bank_name": "bank name or empty string",
  "notes": "any other relevant info or empty string"
}

Do NOT include any markdown, backticks, explanation, or extra text. Only the JSON object.

TEXT TO PARSE:
${text}
`;

    let raw = '{}';
    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 512,
      });
      raw = completion.choices[0]?.message?.content ?? '{}';
    } catch (err: any) {
      console.error('[OcrGroqService] Groq API error:', err);
      throw new InternalServerErrorException(
        `Groq API call failed: ${err?.message ?? String(err)}`,
      );
    }

    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[OcrGroqService] No JSON found in Groq response:', raw);
      return this.emptyResult();
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as Partial<PaymentOcrResult>;
      return {
        payment_method: parsed.payment_method ?? '',
        payment_date: parsed.payment_date ?? '',
        amount: parsed.amount ?? '',
        reference: parsed.reference ?? '',
        cheque_number: parsed.cheque_number ?? '',
        bank_name: parsed.bank_name ?? '',
        notes: parsed.notes ?? '',
      };
    } catch (parseError) {
      console.error('[OcrGroqService] Failed to parse Groq JSON:', jsonMatch[0], parseError);
      return this.emptyResult();
    }
  }

  async processImage(file: Express.Multer.File): Promise<PaymentOcrResult> {
    const text = await this.imageToText(file);

    if (!text || text.trim().length < 5) {
      console.warn('[OcrGroqService] Tesseract extracted very little text:', text);
      return this.emptyResult();
    }

    return this.extractPaymentData(text);
  }

  private emptyResult(): PaymentOcrResult {
    return {
      payment_method: '',
      payment_date: '',
      amount: '',
      reference: '',
      cheque_number: '',
      bank_name: '',
      notes: '',
    };
  }
}