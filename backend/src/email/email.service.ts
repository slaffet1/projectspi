import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    sendInvoice(arg0: number) {
        throw new Error('Method not implemented.');
    }
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'mohamedaminechoukani02@gmail.com',
      pass: 'qtrx kzmw tpry dkgn',  
    },
  });

 async sendVerificationEmail(email: string, token: string) {
    const   url = `http://localhost:5173/verifEmail?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2 style="color: #1E90FF;">Bienvenue sur notre plateforme ! 🎉</h2>
        <p>Bonjour,</p>
        <p>Merci de t’être inscrit. Clique sur le bouton ci-dessous pour vérifier ton email :</p>
        <a href="${url}" 
           style="display: inline-block; padding: 12px 25px; margin: 20px 0; font-size: 16px; color: white; background-color: #1E90FF; border-radius: 5px; text-decoration: none;">
           Vérifier mon email
        </a>
        
        <hr style="margin-top: 30px;">
        <p style="font-size: 12px; color: #888;">&copy; 2026 MonApplication. Tous droits réservés.</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: '"plateforme"',
      to: email,
      subject: 'Vérifie ton email',
      html: html,
    });
  }
}