import { Client } from 'pg';

export class CertificateHandler {
  private db: Client | null = null;

  constructor() {
    this.initDb();
  }

  private async initDb(): Promise<void> {
    try {
      this.db = new Client({
        connectionString:
          process.env.DATABASE_URL || 'postgres://nullcarbon:nullcarbon@localhost:5432/nullcarbon',
      });
      await this.db.connect();
      console.log('CertificateHandler connected to PostgreSQL');
    } catch {
      console.warn('CertificateHandler: PostgreSQL not available');
    }
  }

  async indexCertificate(params: {
    certificateId: string;
    nullifier: string;
    registryRoot?: string;
    volumeCommitment?: string;
    corridorId?: string;
    stellarTxHash: string;
    ledger: number;
  }): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.query(
        `INSERT INTO retirement_certificates
         (certificate_id, nullifier, registry_root, volume_commitment, corridor_id, stellar_tx_hash, ledger, issued_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (certificate_id) DO NOTHING`,
        [
          params.certificateId,
          params.nullifier,
          params.registryRoot || null,
          params.volumeCommitment || null,
          params.corridorId || null,
          params.stellarTxHash,
          params.ledger,
        ],
      );
    } catch (err) {
      console.error('Failed to index certificate:', err);
    }
  }
}
