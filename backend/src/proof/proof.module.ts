import { Module } from '@nestjs/common';
import { ProofService } from './proof.service';
import { ProofController } from './proof.controller';
import { NullifierModule } from '../nullifier/nullifier.module';
import { CertificateModule } from '../certificate/certificate.module';

@Module({
  imports: [NullifierModule, CertificateModule],
  controllers: [ProofController],
  providers: [ProofService],
  exports: [ProofService],
})
export class ProofModule {}
