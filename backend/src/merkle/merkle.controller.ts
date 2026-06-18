import { Controller, Get, Post, Param, NotFoundException } from '@nestjs/common';
import { MerkleService } from './merkle.service';

@Controller()
export class MerkleController {
  constructor(private readonly merkleService: MerkleService) {}

  @Get('registry/merkle-proof/:creditHash')
  async getMerkleProof(@Param('creditHash') creditHash: string) {
    const proof = await this.merkleService.getMerkleProof(creditHash);
    if (!proof) throw new NotFoundException('Credit not found in Merkle tree');
    return proof;
  }

  @Post('merkle/rebuild')
  async rebuild() {
    const roots = await this.merkleService.rebuildTrees();
    return { roots, rebuilt: true };
  }
}
