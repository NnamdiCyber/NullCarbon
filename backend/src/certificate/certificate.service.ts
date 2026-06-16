import { Injectable } from '@nestjs/common';

export interface Certificate {
  certificateId: string;
  nullifier: string;
  registryRoot?: string;
  volumeCommitment?: string;
  corridorId?: string;
  timestamp?: string;
  stellarTxHash?: string;
  ledger?: number;
  verifiable: boolean;
}

@Injectable()
export class CertificateService {
  private certificates: Certificate[] = [];
  private sequence = 0;

  async getByCertificateId(id: string): Promise<Certificate | null> {
    return this.certificates.find((c) => c.certificateId === id) || null;
  }

  async getByNullifier(nullifier: string): Promise<Certificate | null> {
    return this.certificates.find((c) => c.nullifier === nullifier) || null;
  }

  async verifyOnChain(nullifier: string): Promise<boolean> {
    return false;
  }

  async getPublicFeed(limit = 20, offset = 0): Promise<Certificate[]> {
    return this.certificates.slice(offset, offset + limit);
  }

  async addCertificate(cert: Omit<Certificate, 'certificateId'>): Promise<Certificate> {
    this.sequence++;
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const certificate: Certificate = {
      ...cert,
      certificateId: `CERT-${dateStr}-${String(this.sequence).padStart(5, '0')}`,
    };
    this.certificates.unshift(certificate);
    return certificate;
  }
}
