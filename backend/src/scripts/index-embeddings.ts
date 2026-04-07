import { PrismaClient } from '@prisma/client';
import { HfInference } from '@huggingface/inference';

const prisma = new PrismaClient();
const hf = new HfInference(process.env.HF_TOKEN);

async function embed(text: string): Promise<number[]> {
  const result = await hf.featureExtraction({
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    inputs: text,
  });
  return Array.isArray((result as any)[0]) ? (result as number[][])[0] : (result as number[]);
}

async function main() {
  const products = await prisma.products.findMany();
  console.log(`Indexing ${products.length} products...`);
  for (const p of products) {
    const text = `${p.name} ${p.description ?? ''} ${p.category ?? ''}`;
    const embedding = await embed(text);
    await prisma.products.update({ where: { id: p.id }, data: { embedding } });
    console.log(`✓ ${p.name}`);
  }

  const clients = await prisma.clients.findMany();
  console.log(`Indexing ${clients.length} clients...`);
  for (const c of clients) {
    const text = `${c.name} ${c.email ?? ''} ${c.city ?? ''} ${c.country ?? ''}`;
    const embedding = await embed(text);
    await prisma.clients.update({ where: { id: c.id }, data: { embedding } });
    console.log(`✓ ${c.name}`);
  }

  await prisma.$disconnect();
}

main();