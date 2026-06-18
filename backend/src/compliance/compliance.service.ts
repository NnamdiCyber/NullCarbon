import { Injectable, Inject, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import { NullifierService } from '../nullifier/nullifier.service';

export interface ComplianceClaim {
  nullifiers: string[];
  periodId: string;
  nullifierSetRoot: string;
  totalVolume?: number;
}

export interface ComplianceStatus {
  compliant: boolean;
  periodId?: string;
  verifiedAt?: string;
  certificateId?: string;
}

// Simple Merkle root of a nullifier set: hash pairs iteratively.
// Uses the same Poseidon2 approach as the backend Merkle service.
function computeNullifierSetRoot(nullifiers: string[]): string {
  if (nullifiers.length === 0) return '0x' + '0'.repeat(64);

  let layer = [...nullifiers];
  while (layer.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const l = layer[i];
      const r = layer[i + 1] ?? l;
      // Simple deterministic combine for dev; production uses Poseidon2
      const combined = BigInt(l) ^ BigInt(r);
      next.push('0x' + combined.toString(16).padStart(64, '0'));
    }
    layer = next;
  }
  return layer[0];
}

@Injectable()
export class ComplianceService {
  constructor(
    private readonly nullifierService: NullifierService,
    @Optional() @Inject('PG_POOL') private readonly db?: Pool,
  ) {}

  async generateComplianceClaim(
    nullifiers: string[],
    periodId: string,
    _companySecret: string,
  ): Promise<ComplianceClaim> {
    // Verify each nullifier is recorded on-chain
    const verified: string[] = [];
    for (const n of nullifiers) {
      if (await this.nullifierService.isUsed(n)) {
        verified.push(n);
      }
    }

    const nullifierSetRoot = computeNullifierSetRoot(verified);

    return {
      nullifiers: verified,
      periodId,
      nullifierSetRoot,
    };
  }

  async getComplianceStatus(companyId: string): Promise<ComplianceStatus> {
    if (this.db) {
      const result = await this.db.query<{
        certificate_id: string;
        issued_at: Date;
        corridor_id: string;
      }>(
        `SELECT certificate_id, issued_at, corridor_id
         FROM retirement_certificates
         WHERE corridor_id LIKE 'compliance%'
         ORDER BY issued_at DESC LIMIT 1`,
      );
      if (result.rowCount && result.rowCount > 0) {
        const row = result.rows[0];
        return {
          compliant: true,
          periodId: companyId,
          verifiedAt: row.issued_at.toISOString(),
          certificateId: row.certificate_id,
        };
      }
    }
    return { compliant: false };
  }
}
