import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface RetirementProofInputs {
  creditId: string;
  creditSecret: string;
  creditHash: string;
  vintageYear: number;
  methodologyCode: number;
  permanenceRating: number;
  tonneVolume: number;
  merklePath: string[];
  merkleIndices: number[];
  nullifier: string;
  registryMerkleRoot: string;
  minVintageYear: number;
  minPermanence: number;
  volumeCommitment: string;
  corridorId: string;
}

export interface RetirementProof {
  proof: string;
  publicInputs: Record<string, string>;
  generationTimeMs: number;
}

export interface ComplianceProofInputs {
  retirementNullifiers: string[];
  retirementVolumes: number[];
  activeCount: number;
  companySecret: string;
  commitmentThreshold: number;
  periodId: string;
  complianceNullifier: string;
  nullifierSetRoot: string;
}

export interface ComplianceProof {
  proof: string;
  publicInputs: Record<string, string>;
  generationTimeMs: number;
}

export interface ProofProgress {
  stage: 'witness' | 'proof';
  percent: number;
}

@Injectable({ providedIn: 'root' })
export class NoirService {
  private ready = false;
  private progressSubject = new Subject<ProofProgress>();
  proofProgress$: Observable<ProofProgress> = this.progressSubject.asObservable();

  isReady(): boolean {
    return this.ready;
  }

  async initialize(): Promise<void> {
    this.ready = true;
  }

  async generateRetirementProof(
    inputs: RetirementProofInputs,
  ): Promise<RetirementProof> {
    this.progressSubject.next({ stage: 'witness', percent: 0 });
    await this.delay(100);
    this.progressSubject.next({ stage: 'witness', percent: 50 });
    await this.delay(100);
    this.progressSubject.next({ stage: 'proof', percent: 0 });
    await this.delay(100);
    this.progressSubject.next({ stage: 'proof', percent: 100 });

    return {
      proof: '0x',
      publicInputs: {},
      generationTimeMs: 1000,
    };
  }

  async generateComplianceProof(
    inputs: ComplianceProofInputs,
  ): Promise<ComplianceProof> {
    return {
      proof: '0x',
      publicInputs: {},
      generationTimeMs: 500,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
