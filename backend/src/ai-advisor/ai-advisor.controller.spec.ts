import { Test, TestingModule } from '@nestjs/testing';
import { AiAdvisorController } from './ai-advisor.controller';
import { AiAdvisorService } from './ai-advisor.service';

const mockAiAdvisorService = {
  chat: jest.fn(),
};

describe('AiAdvisorController', () => {
  let controller: AiAdvisorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiAdvisorController],
      providers: [
        { provide: AiAdvisorService, useValue: mockAiAdvisorService },
      ],
    }).compile();

    controller = module.get<AiAdvisorController>(AiAdvisorController);
    jest.clearAllMocks();
  });

  // ── chat ────────────────────────────────────────────────────────
  describe('chat', () => {
    it('should call aiAdvisorService.chat and return the reply', async () => {
      const businessId = 1;
      const messages = [
        { role: 'user' as const, content: `Quel est mon chiffre d'affaires ?` },
      ];
      const aiReply = `Votre chiffre d'affaires est de 50 000 TND.`;

      mockAiAdvisorService.chat.mockResolvedValue(aiReply);

      const result = await controller.chat(businessId, { messages });

      expect(mockAiAdvisorService.chat).toHaveBeenCalledWith(businessId, messages);
      expect(result).toEqual({ reply: aiReply });
    });

    it('should pass the correct businessId to the service', async () => {
      const businessId = 42;
      const messages = [{ role: 'user' as const, content: 'Bonjour' }];

      mockAiAdvisorService.chat.mockResolvedValue('Bonjour !');

      await controller.chat(businessId, { messages });

      expect(mockAiAdvisorService.chat).toHaveBeenCalledWith(42, messages);
    });

    it('should handle a multi-turn conversation', async () => {
      const businessId = 1;
      const messages = [
        { role: 'user' as const, content: 'Quelles sont mes depenses ?' },
        { role: 'assistant' as const, content: 'Vos depenses sont de 10 000 TND.' },
        { role: 'user' as const, content: 'Et mes revenus ?' },
      ];
      const aiReply = 'Vos revenus sont de 60 000 TND.';

      mockAiAdvisorService.chat.mockResolvedValue(aiReply);

      const result = await controller.chat(businessId, { messages });

      expect(mockAiAdvisorService.chat).toHaveBeenCalledWith(businessId, messages);
      expect(result).toEqual({ reply: aiReply });
    });

    it('should return the reply wrapped in an object', async () => {
      mockAiAdvisorService.chat.mockResolvedValue('Une reponse quelconque');

      const result = await controller.chat(1, {
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(result).toHaveProperty('reply');
      expect(result.reply).toBe('Une reponse quelconque');
    });

    it('should propagate errors thrown by the service', async () => {
      mockAiAdvisorService.chat.mockRejectedValue(new Error('AI service unavailable'));

      await expect(
        controller.chat(1, { messages: [{ role: 'user', content: 'Test' }] }),
      ).rejects.toThrow('AI service unavailable');
    });
  });
});