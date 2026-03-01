import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as nodemailer from 'nodemailer';

@Injectable()
export class InviteUsersService {
  constructor(private prisma: PrismaService) {}

  // Configuration email (pour le développement)
  private transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'votre.email@gmail.com',    // TODO: Remplacer
      pass: 'votre_mot_de_passe_app',   // TODO: Remplacer
    },
  });

  // Inviter un utilisateur
  async inviteUser(businessId: number, email: string, roleId: number) {
    // 1. Vérifier que l'entreprise existe
    const business = await this.prisma.businesses.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // 2. Vérifier que le rôle existe
    const role = await this.prisma.roles.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // 3. Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      // CAS 1 : L'utilisateur existe → ajout direct
      return this.addExistingUser(existingUser, business, role);
    } else {
      // CAS 2 : L'utilisateur n'existe pas → créer une invitation
      return this.createInvitation(email, business, role);
    }
  }

  // CAS 1 : Ajouter un utilisateur existant
  private async addExistingUser(user: any, business: any, role: any) {
    // Vérifier s'il est déjà membre
    const existing = await this.prisma.business_users.findUnique({
      where: {
        user_id_business_id: {
          user_id: user.id,
          business_id: business.id,
        },
      },
    });

    if (existing) {
      return {
        status: 'already_member',
        message: 'Cet utilisateur est déjà membre de cette entreprise',
      };
    }

    // Ajouter à l'entreprise
    await this.prisma.business_users.create({
      data: {
        user_id: user.id,
        business_id: business.id,
        role_id: role.id,
      },
    });

    // Envoyer un email de notification
    await this.sendNotificationEmail(user.email, business.name, role.title);

    return {
      status: 'added',
      message: `${user.firstname} ${user.lastname} a été ajouté à ${business.name} en tant que ${role.title}`,
    };
  }

  // CAS 2 : Créer une invitation pour un nouvel utilisateur
  private async createInvitation(email: string, business: any, role: any) {
    // Vérifier si une invitation existe déjà
    const existingInvitation = await this.prisma.invitations.findFirst({
      where: {
        email,
        business_id: business.id,
        status: 'pending',
      },
    });

    if (existingInvitation) {
      return {
        status: 'already_invited',
        message: 'Une invitation a déjà été envoyée à cet email',
      };
    }

    // Générer un token unique
    const token = uuidv4();

    // Date d'expiration : 7 jours
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Créer l'invitation
    await this.prisma.invitations.create({
      data: {
        email,
        business_id: business.id,
        role_id: role.id,
        token,
        status: 'pending',
        expires_at: expiresAt,
      },
    });

    // Envoyer l'email d'invitation
    await this.sendInvitationEmail(email, business.name, role.title, token);

    return {
      status: 'invited',
      message: `Une invitation a été envoyée à ${email}`,
      token,
    };
  }

  // Accepter une invitation (après inscription)
  async acceptInvitation(token: string, userId: number) {
    const invitation = await this.prisma.invitations.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      return { message: 'Cette invitation a déjà été utilisée' };
    }

    // Vérifier si l'invitation a expiré
    if (invitation.expires_at && new Date() > invitation.expires_at) {
      await this.prisma.invitations.update({
        where: { token },
        data: { status: 'expired' },
      });
      return { message: 'Cette invitation a expiré' };
    }

    // Ajouter l'utilisateur à l'entreprise
    await this.prisma.business_users.create({
      data: {
        user_id: userId,
        business_id: invitation.business_id,
        role_id: invitation.role_id,
      },
    });

    // Mettre à jour le statut de l'invitation
    await this.prisma.invitations.update({
      where: { token },
      data: { status: 'accepted' },
    });

    return {
      status: 'accepted',
      message: 'Invitation acceptée avec succès',
    };
  }

  // Voir les invitations en attente
  async getPendingInvitations(businessId: number) {
    const invitations = await this.prisma.invitations.findMany({
      where: {
        business_id: businessId,
        status: 'pending',
      },
      include: {
        roles: {
          select: { title: true },
        },
      },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.roles?.title,
      status: inv.status,
      created_at: inv.created_at,
      expires_at: inv.expires_at,
    }));
  }

  // Annuler une invitation
  async cancelInvitation(invitationId: number) {
    const invitation = await this.prisma.invitations.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.prisma.invitations.delete({
      where: { id: invitationId },
    });

    return { message: 'Invitation annulée' };
  }

  // Voir tous les membres d'une entreprise
  async getBusinessMembers(businessId: number) {
    const business = await this.prisma.businesses.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const members = await this.prisma.business_users.findMany({
      where: { business_id: businessId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
          },
        },
        roles: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return members.map((m) => ({
      user_id: m.users?.id,
      email: m.users?.email,
      firstname: m.users?.firstname,
      lastname: m.users?.lastname,
      role: m.roles?.title,
      joined_at: m.created_at,
    }));
  }

  // Supprimer un membre
  async removeMember(businessId: number, userId: number) {
    const member = await this.prisma.business_users.findUnique({
      where: {
        user_id_business_id: {
          user_id: userId,
          business_id: businessId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this business');
    }

    await this.prisma.business_users.delete({
      where: {
        user_id_business_id: {
          user_id: userId,
          business_id: businessId,
        },
      },
    });

    return { message: 'Membre retiré avec succès' };
  }

  // Envoyer email de notification (utilisateur existant)
  private async sendNotificationEmail(email: string, businessName: string, roleName: string) {
    try {
      await this.transporter.sendMail({
        from: '"Business Manager" <noreply@businessmanager.tn>',
        to: email,
        subject: `Vous avez été ajouté à ${businessName}`,
        html: `
          <h2>Bienvenue !</h2>
          <p>Vous avez été ajouté à <strong>${businessName}</strong> en tant que <strong>${roleName}</strong>.</p>
          <p><a href="http://localhost:5173/app">Accéder à la plateforme</a></p>
        `,
      });
    } catch (error) {
      console.log('Email not sent (dev mode):', error.message);
    }
  }

  // Envoyer email d'invitation (nouvel utilisateur)
  private async sendInvitationEmail(email: string, businessName: string, roleName: string, token: string) {
    try {
      await this.transporter.sendMail({
        from: '"Business Manager" <noreply@businessmanager.tn>',
        to: email,
        subject: `Invitation à rejoindre ${businessName}`,
        html: `
          <h2>Vous êtes invité !</h2>
          <p><strong>${businessName}</strong> vous invite à rejoindre leur entreprise en tant que <strong>${roleName}</strong>.</p>
          <p><a href="http://localhost:5173/register?token=${token}">Créer votre compte et rejoindre</a></p>
          <p><em>Ce lien expire dans 7 jours.</em></p>
        `,
      });
    } catch (error) {
      console.log('Email not sent (dev mode):', error.message);
    }
  }
}