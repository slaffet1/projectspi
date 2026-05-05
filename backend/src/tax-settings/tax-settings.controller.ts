import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { TaxSettingsService } from './tax-settings.service';

@Controller()
export class TaxSettingsController {
  constructor(private readonly service: TaxSettingsService) {}

  // GET /api/taxes/default
  @Get('taxes/default')
  async getAllDefaultTaxes() {
    return this.service.getAllDefaultTaxes();
  }

  // GET /api/businesses/:id/taxes
  @Get('businesses/:id/taxes')
  async getBusinessTaxes(@Param('id') id: string) {
    return this.service.getBusinessTaxes(Number(id));
  }

  // POST /api/taxes
  @Post('taxes')
  async createTax(
    @Body() body: {
      name: string;
      rate: number;
      description: string;
      is_default: boolean;
      business_id?: number;
    },
  ) {
    return this.service.createTax(
      body.name,
      body.rate,
      body.description,
      body.is_default,
      body.business_id,
    );
  }

  // PUT /api/taxes/:id
  @Put('taxes/:id')
  async updateTax(
    @Param('id') id: string,
    @Body() body: {
      name: string;
      rate: number;
      description: string;
    },
  ) {
    return this.service.updateTax(
      Number(id),
      body.name,
      body.rate,
      body.description,
    );
  }

  // DELETE /api/taxes/:id
  @Delete('taxes/:id')
  async deleteTax(@Param('id') id: string) {
    return this.service.deleteTax(Number(id));
  }
}