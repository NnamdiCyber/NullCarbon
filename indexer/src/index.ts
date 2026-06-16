import { RetirementHandler } from './handlers/retirement.handler';

const STELLAR_RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const RETIREMENT_VERIFIER_ID = process.env.RETIREMENT_VERIFIER_ID || '';
const NULLIFIER_REGISTRY_ID = process.env.NULLIFIER_REGISTRY_ID || '';
const POLL_INTERVAL_MS = 5000;
const MAX_RETRIES = 5;

async function main() {
  console.log('NullCarbon Indexer starting...');
  console.log(`  RPC: ${STELLAR_RPC_URL}`);
  console.log(`  RetirementVerifier: ${RETIREMENT_VERIFIER_ID}`);
  console.log(`  NullifierRegistry: ${NULLIFIER_REGISTRY_ID}`);
  console.log(`  Poll interval: ${POLL_INTERVAL_MS}ms`);

  const retirementHandler = new RetirementHandler(
    STELLAR_RPC_URL,
    RETIREMENT_VERIFIER_ID,
    NULLIFIER_REGISTRY_ID,
  );

  let retryCount = 0;

  async function poll() {
    try {
      await retirementHandler.poll();
      retryCount = 0;
    } catch (err) {
      retryCount++;
      console.error(`Poll error (attempt ${retryCount}):`, err);

      if (retryCount >= MAX_RETRIES) {
        console.error(`Max retries reached. Waiting ${POLL_INTERVAL_MS * 2}ms...`);
        await delay(POLL_INTERVAL_MS * 2);
        retryCount = 0;
      }
    }
  }

  // Initial poll immediately, then on interval
  await poll();
  setInterval(poll, POLL_INTERVAL_MS);

  console.log('Indexer running. Press Ctrl+C to stop.');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

process.on('SIGINT', () => {
  console.log('\nIndexer shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nIndexer shutting down...');
  process.exit(0);
});

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
