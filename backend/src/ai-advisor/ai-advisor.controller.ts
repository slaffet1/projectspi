import { Controller, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { AiAdvisorService } from './ai-advisor.service';

class ChatDto {
  messages: { role: 'user' | 'assistant'; content: string }[];
}

@Controller('api/businesses/:businessId/ai-advisor')
export class AiAdvisorController {
  constructor(private readonly aiAdvisorService: AiAdvisorService) {}

  @Post('chat')
  async chat(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Body() body: ChatDto,
  ) {
    const reply = await this.aiAdvisorService.chat(businessId, body.messages);
    return { reply };
  }
}