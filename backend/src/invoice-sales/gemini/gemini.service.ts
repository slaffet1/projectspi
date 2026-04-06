import { Injectable } from "@nestjs/common";
import Groq from "groq-sdk";

const DEFAULT_LABELS = {
  invoice_title: "FACTURE",
  billed_to: "Facturé à",
  due_date: "Échéance",
  product: "Produit",
  qty: "Qté",
  price: "Prix",
  tax: "TVA",
  total: "Total",
  subtotal: "Sous-total",
  discount: "Remise",
  adjustment: "Ajustement",
  thank_you: "Merci pour votre confiance",
  professional_billing: "Facturation professionnelle",
};
export type InvoiceLabels = typeof DEFAULT_LABELS;


@Injectable()
export class GeminiService {
 private client = new Groq({
    apiKey: process.env.API_TRANS,
  });

  async translateInvoiceLabels(language: string): Promise<InvoiceLabels> {
    if (!language || language === "fr") return DEFAULT_LABELS;
console.log(process.env.API_TRANS)
const prompt = `
You are a professional translator API.

TASK:
Translate ALL VALUES of the JSON below from French into "${language}".

STRICT RULES:
- DO NOT translate keys
- DO NOT keep French text
- ALWAYS translate values to the target language
- Return ONLY valid JSON
- NO explanations
- NO markdown
- NO extra text

LANGUAGE RULES:
- "en" = English
- "ar" = Arabic
- "it" = Italian
- "de" = German
- "es" = Spanish

If the language is Arabic:
- Use formal Arabic (Modern Standard Arabic)

OUTPUT FORMAT:
Must be EXACTLY the same JSON structure.

JSON:
${JSON.stringify(DEFAULT_LABELS)}
`;

    try {
      const completion = await this.client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
      });

      const text = completion.choices[0].message.content;
//console.log("RAW AI RESPONSE:", text);
      if (!text) throw new Error("Empty response");

      const clean = text.replace(/```json|```/g, "").trim();

      const parsed: InvoiceLabels = JSON.parse(clean);

      const keysValid = Object.keys(DEFAULT_LABELS).every(
        (key) => key in parsed
      );

      if (!keysValid) {
        return DEFAULT_LABELS;
      }

      return parsed;
    } catch (error) {
      console.error("Groq translation error:", error);
      return DEFAULT_LABELS;
    }
    
  }
  
}