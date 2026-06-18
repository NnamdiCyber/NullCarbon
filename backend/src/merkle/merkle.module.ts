import { Module } from '@nestjs/common';
import { MerkleService } from './merkle.service';
import { MerkleController } from './merkle.controller';
import { RegistryModule } from '../registry/registry.module';

@Module({
  imports: [RegistryModule],
  controllers: [MerkleController],
  providers: [MerkleService],
  exports: [MerkleService],
})
export class MerkleModule {}
