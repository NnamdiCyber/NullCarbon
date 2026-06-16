import { Controller, Get, Post, Query } from '@nestjs/common';
import { RegistryService } from './registry.service';

@Controller('registry')
export class RegistryController {
  constructor(private readonly registryService: RegistryService) {}

  @Get('credits')
  async getCredits(
    @Query('registry') registry?: string,
    @Query('vintage_min') vintageMin?: string,
    @Query('vintage_max') vintageMax?: string,
    @Query('methodology') methodology?: string,
    @Query('volume_min') volumeMin?: string,
  ) {
    const credits = await this.registryService.getCredits({
      registry,
      vintageMin: vintageMin ? parseInt(vintageMin, 10) : undefined,
      vintageMax: vintageMax ? parseInt(vintageMax, 10) : undefined,
      methodology,
      volumeMin: volumeMin ? parseInt(volumeMin, 10) : undefined,
    });
    return { credits };
  }

  @Post('sync')
  async sync() {
    const credits = await this.registryService.syncRegistry();
    return { credits, synced: true };
  }
}
