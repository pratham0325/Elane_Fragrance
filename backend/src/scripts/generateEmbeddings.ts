/**
 * Generates Scent Intelligence embeddings for all active products.
 *
 *   npm run embed          # only products missing/outdated embeddings
 *   npm run embed -- --force   # regenerate everything
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { env, isAIEnabled } from '../config/env';
import { reindexProducts, getIndexStatus } from '../services/ai/EmbeddingService';

async function main() {
  const force = process.argv.includes('--force');

  console.log('🧠 Scent Intelligence — embedding generation');

  if (!isAIEnabled) {
    console.log('\n⚠️  No AI provider configured (AI_PROVIDER / AI_API_KEY).');
    console.log('   The app will still work — search falls back to lexical matching.');
    console.log('   Set AI_PROVIDER=openai and AI_API_KEY=sk-... in backend/.env to enable.\n');
    process.exit(0);
  }

  await mongoose.connect(env.MONGO_URI);
  console.log('  ✓ MongoDB connected');

  const before = await getIndexStatus();
  console.log(`  Provider: ${before.providerName} (${before.embeddingModel})`);
  console.log(`  Products: ${before.totalProducts} total, ${before.indexedProducts} already indexed`);

  if (force) console.log('  Mode: FORCE — regenerating all embeddings');

  const result = await reindexProducts({ force });

  console.log('\n📊 Result:');
  console.log(`   Indexed: ${result.indexed}`);
  console.log(`   Skipped (up to date): ${result.skipped}`);
  console.log(`   Failed:  ${result.failed}`);
  if (result.errors.length) {
    console.log('\n⚠️  Errors:');
    result.errors.slice(0, 5).forEach((e) => console.log(`   - ${e}`));
  }

  await mongoose.disconnect();
  console.log('\n✅ Done.');
}

main().catch((err) => {
  console.error('Embedding generation failed:', err);
  process.exit(1);
});
