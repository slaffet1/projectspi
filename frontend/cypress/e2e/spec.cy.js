describe('Authentication flow', () => {

  it('login + 2FA success flow', () => {

    cy.visit('http://localhost:5173');
    cy.wait(1000);

    cy.get('[data-cy=navbar-login]').click();
    cy.wait(800);

    cy.url().should('include', '/login');
    cy.wait(500);

    cy.intercept('POST', '**/api/users/login').as('loginRequest');

    cy.get('[data-cy=email-input]').type('leffat@email.com', { delay: 80 });
    cy.wait(400);

    cy.get('[data-cy=password-input]').type('123456789', { delay: 80 });
    cy.wait(600);

    cy.get('[data-cy=login-submit]').click();
    cy.wait(800);

    cy.wait('@loginRequest')
      .its('response.statusCode')
      .should('eq', 201);
    cy.wait(1000);

    cy.get('[data-cy=otp-input]').should('be.visible');
    cy.wait(800);

    cy.intercept('POST', '**/api/users/verify-2fa').as('otpRequest');

    cy.get('[data-cy=otp-input]').type('000000', { delay: 150 });
    cy.wait(800);

    cy.get('[data-cy=otp-submit]').click();
    cy.wait(800);

    cy.wait('@otpRequest')
      .its('response.statusCode')
      .should('eq', 201);
    cy.wait(1200);

    cy.url().should('include', '/onboarding');
    cy.wait(1500);

    cy.get('[data-cy=business-enter]', { timeout: 8000 }).first().click();
    cy.wait(800);

    cy.url().should('include', '/app');
  });

});