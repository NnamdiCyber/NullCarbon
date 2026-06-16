import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RegistryModule } from './registry/registry.module';
import { MerkleModule } from './merkle/merkle.module';
import { ProofModule } from './proof/proof.module';
import { CertificateModule } from './certificate/certificate.module';
import { NullifierModule } from './nullifier/nullifier.module';
import { ComplianceModule } from './compliance/compliance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RegistryModule,
    MerkleModule,
    ProofModule,
    CertificateModule,
    NullifierModule,
    ComplianceModule,
  ],
})
export class AppModule {}
