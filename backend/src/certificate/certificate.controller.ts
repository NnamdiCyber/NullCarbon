import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { CertificateService } from './certificate.service';

@Controller()
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Get('certificate/verify/:nullifier')
  async verifyNullifier(@Param('nullifier') nullifier: string) {
    const cert = await this.certificateService.getByNullifier(nullifier);
    const onChain = await this.certificateService.verifyOnChain(nullifier);
    return { nullifier, onChain, certificate: cert };
  }

  @Get('certificate/:id')
  async getCertificate(@Param('id') id: string) {
    const cert = await this.certificateService.getByCertificateId(id);
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }

  @Get('certificates/feed')
  async getFeed(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.certificateService.getPublicFeed(
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }
}
