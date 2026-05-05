import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

// ── Mock nodemailer ────────────────────────────────────────────────────────
// jest.mock() is hoisted to the top of the file before any variable
// declarations, so referencing a const defined outside the factory would
// cause "Cannot access before initialization". The sendMail mock is
// therefore created inside the factory and retrieved via the mock's
// return value after the module is loaded.
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn(),
  }),
}));

// Helper to access the sendMail mock after nodemailer has been mocked
const getSendMailMock = (): jest.Mock =>
  (nodemailer.createTransport as jest.Mock).mock.results[0].value.sendMail;

// ══════════════════════════════════════════════════════════════════════════
describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);

    // Reset only sendMail between tests; createTransport is called once at
    // class instantiation so we preserve its mock.results reference.
    getSendMailMock().mockReset();
  });

  // ── transporter setup ────────────────────────────────────────────────────
  describe('transporter', () => {
    it('should create a nodemailer transporter with gmail service', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ service: 'gmail' }),
      );
    });

    it('should configure transporter with auth credentials', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: expect.objectContaining({
            user: expect.any(String),
            pass: expect.any(String),
          }),
        }),
      );
    });
  });

  // ── sendVerificationEmail ────────────────────────────────────────────────
  describe('sendVerificationEmail', () => {
    const email = 'user@example.com';
    const token = 'abc123token';

    it('should call sendMail exactly once', async () => {
      getSendMailMock().mockResolvedValue({ messageId: 'msg-001' });

      await service.sendVerificationEmail(email, token);

      expect(getSendMailMock()).toHaveBeenCalledTimes(1);
    });

    it('should send to the correct recipient', async () => {
      getSendMailMock().mockResolvedValue({});

      await service.sendVerificationEmail(email, token);

      expect(getSendMailMock()).toHaveBeenCalledWith(
        expect.objectContaining({ to: email }),
      );
    });

    it('should use the correct email subject', async () => {
      getSendMailMock().mockResolvedValue({});

      await service.sendVerificationEmail(email, token);

      expect(getSendMailMock()).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'Vérifie ton email' }),
      );
    });

    it('should include the token in the verification URL inside the html', async () => {
      getSendMailMock().mockResolvedValue({});

      await service.sendVerificationEmail(email, token);

      const { html } = getSendMailMock().mock.calls[0][0];
      expect(html).toContain(`token=${token}`);
    });

    it('should include the verifEmail path in the html', async () => {
      getSendMailMock().mockResolvedValue({});

      await service.sendVerificationEmail(email, token);

      const { html } = getSendMailMock().mock.calls[0][0];
      expect(html).toContain('verifEmail');
    });

    it('should include non-empty html content in the mail options', async () => {
      getSendMailMock().mockResolvedValue({});

      await service.sendVerificationEmail(email, token);

      const { html } = getSendMailMock().mock.calls[0][0];
      expect(html).toBeDefined();
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    it('should set a from field in the mail options', async () => {
      getSendMailMock().mockResolvedValue({});

      await service.sendVerificationEmail(email, token);

      const { from } = getSendMailMock().mock.calls[0][0];
      expect(from).toBeDefined();
    });

    it('should resolve successfully when sendMail succeeds', async () => {
      getSendMailMock().mockResolvedValue({ messageId: 'msg-001' });

      await expect(
        service.sendVerificationEmail(email, token),
      ).resolves.not.toThrow();
    });

    it('should propagate error when sendMail rejects', async () => {
      getSendMailMock().mockRejectedValue(new Error('SMTP connection failed'));

      await expect(
        service.sendVerificationEmail(email, token),
      ).rejects.toThrow('SMTP connection failed');
    });

    it('should work with different email addresses', async () => {
      getSendMailMock().mockResolvedValue({});

      await service.sendVerificationEmail('other@domain.tn', 'tokenXYZ');

      expect(getSendMailMock()).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'other@domain.tn' }),
      );
    });

    it('should embed different tokens correctly in the URL', async () => {
      getSendMailMock().mockResolvedValue({});

      const uniqueToken = 'unique-token-999';
      await service.sendVerificationEmail(email, uniqueToken);

      const { html } = getSendMailMock().mock.calls[0][0];
      expect(html).toContain(`token=${uniqueToken}`);
    });
  });

  // ── sendInvoice ──────────────────────────────────────────────────────────
  describe('sendInvoice', () => {
    it('should throw an error (method not implemented)', () => {
      expect(() => service.sendInvoice(1)).toThrow('Method not implemented.');
    });
  });
});