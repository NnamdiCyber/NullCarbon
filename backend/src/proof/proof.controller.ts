import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { IsString, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  ProofService,
  RetirementPublicInputs,
  CompliancePublicInputs,
} from './proof.service';
import { NullifierService } from '../nullifier/nullifier.service';

class RetirementPublicInputsDto implements RetirementPublicInputs {
  @IsString() nullifier: string;
  @IsString() registryMerkleRoot: string;
  @IsString() volumeCommitment: string;
  @IsString() corridorId: string;
  @IsNumber() minVintageYear: number;
  @IsNumber() minPermanence: number;
}

class RetireProofDto {
  @IsString() proof: string;
  @ValidateNested() @Type(() => RetirementPublicInputsDto)
  publicInputs: RetirementPublicInputsDto;
}

class CompliancePublicInputsDto implements CompliancePublicInputs {
  @IsNumber() commitmentThreshold: number;
  @IsString() periodId: string;
  @IsString() complianceNullifier: string;
  @IsString() nullifierSetRoot: string;
}

class ComplianceProofDto {
  @IsString() proof: string;
  @ValidateNested() @Type(() => CompliancePublicInputsDto)
  publicInputs: CompliancePublicInputsDto;
}

@Controller('proof')
export class ProofController {
  constructor(
    private readonly proofService: ProofService,
    private readonly nullifierService: NullifierService,
  ) {}

  @Post('retire')
  async retireProof(@Body() dto: RetireProofDto) {
    return this.proofService.relayRetirementProof(dto.proof, dto.publicInputs);
  }

  @Post('compliance')
  async complianceProof(@Body() dto: ComplianceProofDto) {
    return this.proofService.relayComplianceProof(dto.proof, dto.publicInputs);
  }

  @Get('nullifier/:nullifier')
  async checkNullifier(@Param('nullifier') nullifier: string) {
    const used = await this.nullifierService.isUsed(nullifier);
    return { nullifier, used };
  }
}
