describe('Dice Button', () => {
  it('Pops up the modal', () => {

    cy.visit('http://172.17.0.1:8000');

    cy.get('#dialog_dice').should('not.be.visible')

    cy.contains('+ Dice').click()

    cy.get('#dialog_dice').should('be.visible')
  });
});

describe('Cards button', () => {
  it('Pops up the modal', () => {
    cy.visit('http://172.17.0.1:8000');

    cy.contains('+ Cards').click()
  });
});

describe('Other button', () => {
  it('Pops up the modal', () => {
    cy.visit('http://172.17.0.1:8000');

    cy.get('#dialog_other').should('not.be.visible')
    cy.contains('+ Other').click()
    cy.get('#dialog_other').should('be.visible')

  });
});






