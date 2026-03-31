import { PartialType } from '@nestjs/mapped-types';
import { CreateDeliveryNoteDto } from './createdelivery-notes.dto';

export class UpdateDeliveryNoteDto extends PartialType(CreateDeliveryNoteDto) { }
