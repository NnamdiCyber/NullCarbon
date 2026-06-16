import { Injectable } from '@nestjs/common';

export interface RetirementPublicInputs {
  nullifier: string;
  registryMerkleRoot: string;
  volumeCommitment: string;
  corridorId: string;
  minVintageYear: number;
  minPermanence: number;
}

export interface ProofRelayResult {
  verified: boolean;
  txHash?: string;
  nullifier?: string;
  certificateId?: string;
  error?: string;
}

export interface CompliancePublicInputs {
  commitmentThreshold: number;
  periodId: string;
  complianceNullifier: string;
  nullifierSetRoot: string;
}

export interface ComplianceRelayResult {
  compliant: boolean;
  txHash?: string;
  complianceCertificateId?: string;
  error?: string;
}

@Injectable()
export class ProofService {
  async relayRetirementProof(
    proof: string,
    publicInputs: RetirementPublicInputs,
  ): Promise<ProofRelayResult> {
    return {
      verified: false,
      error: 'Not implemented — Soroban contract integration pending',
    };
  }

  async relayComplianceProof(
    proof: string,
    publicInputs: CompliancePublicInputs,
  ): Promise<ComplianceRelayResult> {
    return {
      compliant: false,
      error: 'Not implemented — Soroban contract integration pending',
    };
  }
}
