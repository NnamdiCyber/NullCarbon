import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { IsString, IsArray } from 'class-validator';
import { ComplianceService } from './compliance.service';

class GenerateClaimDto {
  @IsArray() @IsString({ each: true }) nullifiers: string[];
  @IsString() periodId: string;
  @IsString() companySecret: string;
}

@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('status/:companyId')
  getStatus(@Param('companyId') companyId: string) {
    return this.complianceService.getComplianceStatus(companyId);
  }

  @Post('generate-claim')
  generateClaim(@Body() dto: GenerateClaimDto) {
    return this.complianceService.generateComplianceClaim(
      dto.nullifiers,
      dto.periodId,
      dto.companySecret,
    );
  }
}
