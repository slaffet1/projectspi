import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { InvoiceSettingsService } from './invoice-settings.service';

@Controller('businesses')
export class InvoiceSettingsController {
  constructor(private readonly service: InvoiceSettingsService) {}

  // GET /api/businesses/:id/invoice-settings
  @Get(':id/invoice-settings')
  async getInvoiceSettings(@Param('id') id: string) {
    return this.service.getInvoiceSettings(Number(id));
  }

  // PUT /api/businesses/:id/invoice-settings
  @Put(':id/invoice-settings')
  async updateInvoiceSettings(
    @Param('id') id: string,
    @Body() body: { invoice_prefix: string },
  ) {
    return this.service.updateInvoiceSettings(Number(id), body.invoice_prefix);
  }
}