import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StellarService {
  private address: string | null = null;

  async connect(): Promise<string> {
    this.address = 'GABCDEF1234567890ABCDEF1234567890ABCDEF1234567890';
    return this.address;
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
    return '10000.0000000';
  }

  async submitTransaction(xdr: string): Promise<string> {
    return 'txhash';
  }
}
