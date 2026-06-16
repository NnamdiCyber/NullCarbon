import { Injectable } from '@nestjs/common';

@Injectable()
export class NullifierService {
  private usedNullifiers: Set<string> = new Set();

  async isUsed(nullifier: string): Promise<boolean> {
    return this.usedNullifiers.has(nullifier);
  }

  async record(nullifier: string, corridorId: string, txHash: string): Promise<void> {
    this.usedNullifiers.add(nullifier);
  }

  async getCount(): Promise<number> {
    return this.usedNullifiers.size;
  }
}
