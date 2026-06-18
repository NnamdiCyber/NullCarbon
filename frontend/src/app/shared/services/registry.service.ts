import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Credit {
  creditId: string;
  registry: string;
  vintage: number;
  methodology: string;
  volume: number;
  permanenceRating: number;
  creditHash: string;
  isRetired: boolean;
  methodologyCode?: number;
  merklePath?: string[];
  merkleIndices?: number[];
  merkleRoot?: string;
}

export interface CreditFilters {
  registry?: string;
  vintageMin?: number;
  vintageMax?: number;
  methodology?: string;
  volumeMin?: number;
}

export interface MerkleProof {
  creditHash: string;
  merklePath: string[];
  merkleIndices: number[];
  root: string;
}

@Injectable({ providedIn: 'root' })
export class RegistryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCredits(filters?: CreditFilters): Observable<{ credits: Credit[] }> {
    let params: Record<string, string> = {};
    if (filters?.registry) params['registry'] = filters.registry;
    if (filters?.vintageMin) params['vintage_min'] = String(filters.vintageMin);
    if (filters?.vintageMax) params['vintage_max'] = String(filters.vintageMax);
    if (filters?.methodology) params['methodology'] = filters.methodology;
    if (filters?.volumeMin) params['volume_min'] = String(filters.volumeMin);
    return this.http.get<{ credits: Credit[] }>(`${this.apiUrl}/registry/credits`, { params });
  }

  getMerkleProof(creditHash: string): Observable<MerkleProof> {
    return this.http.get<MerkleProof>(`${this.apiUrl}/registry/merkle-proof/${creditHash}`);
  }

  syncRegistry(): Observable<{ credits: Credit[] }> {
    return this.http.post<{ credits: Credit[] }>(`${this.apiUrl}/registry/sync`, {});
  }
}
