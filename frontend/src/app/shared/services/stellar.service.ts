import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StellarService {
  private address: string | null = null;
  private readonly horizonUrl = environment.stellarHorizonUrl;

  constructor(private http: HttpClient) {}

  async connect(): Promise<string> {
    try {
      // Use Freighter API if available
      const freighter = (window as any).freighterApi
        ?? await this.tryImportFreighter();

      if (!freighter) throw new Error('Freighter not installed');

      const { publicKey } = await freighter.getPublicKey();
      if (!publicKey) throw new Error('No public key returned');

      this.address = publicKey;
      return publicKey;
    } catch (err: any) {
      if (err?.message?.includes('not installed') || err?.message?.includes('not found')) {
        throw new Error('Freighter not installed');
      }
      throw err;
    }
  }

  getAddress(): string | null {
    return this.address;
  }

  isConnected(): boolean {
    return this.address !== null;
  }

  disconnect(): void {
    this.address = null;
  }

  async getXlmBalance(): Promise<string> {
    if (!this.address) return '0';
    try {
      const data = await lastValueFrom(
        this.http.get<{ balances: { asset_type: string; balance: string }[] }>(
          `${this.horizonUrl}/accounts/${this.address}`,
        ),
      );
      const xlm = data.balances.find((b) => b.asset_type === 'native');
      return xlm ? parseFloat(xlm.balance).toFixed(4) : '0';
    } catch {
      return '0';
    }
  }

  async submitTransaction(xdr: string): Promise<string> {
    const freighter = await this.tryImportFreighter();
    if (!freighter) throw new Error('Freighter not installed');

    const { signedXDR } = await freighter.signTransaction(xdr, {
      networkPassphrase: environment.stellarNetworkPassphrase,
    });

    const data = await lastValueFrom(
      this.http.post<{ hash: string }>(
        `${this.horizonUrl}/transactions`,
        new URLSearchParams({ tx: signedXDR }),
      ),
    );
    return data.hash;
  }

  private async tryImportFreighter(): Promise<any> {
    try {
      const mod = await import('@stellar/freighter-api');
      return mod;
    } catch {
      return null;
    }
  }
}
