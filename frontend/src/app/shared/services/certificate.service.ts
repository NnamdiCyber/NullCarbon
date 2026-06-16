import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

@Injectable({ providedIn: 'root' })
export class CertificateService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getByCertificateId(id: string): Observable<Certificate> {
    return this.http.get<Certificate>(`${this.apiUrl}/certificate/${id}`);
  }

  getByNullifier(nullifier: string): Observable<Certificate> {
    return this.http.get<Certificate>(`${this.apiUrl}/certificate/verify/${nullifier}`);
  }

  verifyOnChain(nullifier: string): Observable<{ verified: boolean }> {
    return this.http.get<{ verified: boolean }>(`${this.apiUrl}/certificate/verify/${nullifier}`);
  }

  getPublicFeed(limit = 20, offset = 0): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.apiUrl}/certificates/feed`, {
      params: { limit: String(limit), offset: String(offset) },
    });
  }
}
