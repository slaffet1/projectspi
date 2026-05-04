import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    Query,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { CreditNotesService } from './credit-notes.service';
import { CreateCreditNoteDto } from './credit-notes-dto.dto';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermission } from 'src/permissions/permissions/permissions.guard';

@Controller('api/businesses/:businessId/credit-notes')
@UseGuards(AuthGuard('jwt'))
@RequirePermission('invoices')
export class CreditNotesController {
    constructor(private readonly service: CreditNotesService) { }


    @Get()
    getAll(@Param('businessId', ParseIntPipe) businessId: number) {
        return this.service.getAll(businessId);
    }


    @Get('search/invoices')
    searchInvoices(
        @Param('businessId', ParseIntPipe) businessId: number,
        @Query('q') query: string = '',
    ) {
        return this.service.searchInvoices(businessId, query);
    }


    @Get('search/delivery-notes')
    searchDeliveryNotes(
        @Param('businessId', ParseIntPipe) businessId: number,
        @Query('q') query: string = '',
    ) {
        return this.service.searchDeliveryNotes(businessId, query);
    }


    @Get(':id')
    getOne(
        @Param('businessId', ParseIntPipe) businessId: number,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.service.getOne(businessId, id);
    }


    @Post()
    create(
        @Param('businessId', ParseIntPipe) businessId: number,
        @Body() dto: CreateCreditNoteDto,
    ) {
        return this.service.create(businessId, dto);
    }


    @Delete(':id')
    remove(
        @Param('businessId', ParseIntPipe) businessId: number,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.service.remove(businessId, id);
    }
}

