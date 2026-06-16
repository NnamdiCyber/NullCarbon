import { Client } from 'pg';

interface RetirementEvent {
  nullifier: string;
  volumeCommitment: string;
  corridorId: string;
  txHash: string;
  ledger: number;
  timestamp: number;
}

export class RetirementHandler {
  private db: Client | null = null;
  private lastProcessedLedger = 0;
  private requestId = 1;

  constructor(
    private rpcUrl: string,
    private verifierId: string,
    private nullifierRegistryId: string,
  ) {}

  async poll(): Promise<void> {
    await this.ensureDbConnection();

    if (!this.verifierId) {
      console.warn('RETIREMENT_VERIFIER_ID not set — skipping poll');
      return;
    }

    try {
      const events = await this.fetchEvents();
      for (const event of events) {
        await this.processEvent(event);
      }
    } catch (err) {
      console.error('Error during poll:', err);
    }
  }

  private async fetchEvents(): Promise<RetirementEvent[]> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: this.requestId++,
        method: 'getEvents',
        params: {
          startLedger: this.lastProcessedLedger || 1,
          filters: [
            {
              type: 'contract',
              contractIds: [this.verifierId],
              topics: [['*']],
            },
          ],
          pagination: { limit: 100 },
        },
      }),
    });

    if (!response.ok) {
      console.warn(`getEvents returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    const events: RetirementEvent[] = [];

    if (data.result?.events) {
      for (const raw of data.result.events) {
        events.push({
          nullifier: raw.topic?.[1] || '',
          volumeCommitment: raw.topic?.[2] || '',
          corridorId: raw.topic?.[3] || '',
          txHash: raw.id || '',
          ledger: raw.ledger || 0,
          timestamp: raw.timestamp || 0,
        });

        if (raw.ledger > this.lastProcessedLedger) {
          this.lastProcessedLedger = raw.ledger;
        }
      }
    }

    return events;
  }

  private async processEvent(event: RetirementEvent): Promise<void> {
    if (!this.db) return;

    const certificateId = this.generateCertificateId();

    try {
      await this.db.query(
        `INSERT INTO nullifiers (nullifier, corridor_id, stellar_tx_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT (nullifier) DO NOTHING`,
        [event.nullifier, event.corridorId, event.txHash],
      );

      await this.db.query(
        `INSERT INTO retirement_certificates
         (certificate_id, nullifier, corridor_id, stellar_tx_hash, ledger, issued_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (certificate_id) DO NOTHING`,
        [certificateId, event.nullifier, event.corridorId, event.txHash, event.ledger],
      );

      console.log(
        `Indexed retirement: ${certificateId} | nullifier: ${event.nullifier.slice(0, 16)}... | ledger: ${event.ledger}`,
      );
    } catch (err) {
      console.error(`Failed to index event:`, err);
    }
  }

  private generateCertificateId(): string {
    const now = new Date();
    const dateStr =
      `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const seq = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    return `CERT-${dateStr}-${seq}`;
  }

  private async ensureDbConnection(): Promise<void> {
    if (this.db) return;

    try {
      this.db = new Client({
        connectionString:
          process.env.DATABASE_URL || 'postgres://nullcarbon:nullcarbon@localhost:5432/nullcarbon',
      });
      await this.db.connect();
      console.log('Indexer connected to PostgreSQL');
    } catch (err) {
      console.warn('PostgreSQL not available — running in memory-only mode');
    }
  }
}
