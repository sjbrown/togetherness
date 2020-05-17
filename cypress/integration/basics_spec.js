describe('Dice Button', () => {
  it('Pops up the modal', () => {

    cy.visit('/');

    cy.get('#dialog_dice').should('not.be.visible')

    cy.contains('+ Dice').click()

    cy.get('#dialog_dice').should('be.visible')
  });
});

describe('Cards button', () => {
  it('Pops up the modal', () => {
    cy.visit('/');

    cy.contains('+ Cards').click()
  });
});

describe('Other button', () => {
  it('Pops up the modal', () => {
    cy.visit('/')

    cy.get('#dialog_other').should('not.be.visible')
    cy.contains('+ Other').click()
    cy.get('#dialog_other').should('be.visible')

  })
});

describe('Standard dice', () => {
  it('Pops up the modal', () => {
    cy.visit('/')

    cy.get('#gamearea')

    cy.contains('+ Dice').click()

    cy.get('#dice_input_d4').type('{selectall}1')
      .should('have.value', '1')
    cy.get('#dice_input_d6').type('{selectall}1')
      .should('have.value', '1')
    cy.get('#dice_input_d8').type('{selectall}1')
      .should('have.value', '1')
    cy.get('#dice_input_d10').type('{selectall}1')
      .should('have.value', '1')
    cy.get('#dice_input_d12').type('{selectall}1')
      .should('have.value', '1')
    cy.get('#dice_input_d20').type('{selectall}1')
      .should('have.value', '1')

    cy.get('#dialog_submit_standard').click()
    cy.wait(400).get('#dialog_dice').should('not.be.visible')

  });
});


describe('One d6', () => {
  it('Pops up the modal', () => {
    cy.visit('/')

    cy.get('#svg_table svg').should('not.be.visible')
    cy.get('#svg_viewport [data-app-url="svg/v1/dice_d6.svg"]').should('not.be.visible')

    cy.contains('+ Dice').click()

    cy.get('#dice_input_d6').type('{selectall}1')
      .should('have.value', '1')

    cy.get('#dialog_submit_standard').click()
    cy.wait(400) //.get('#dialog_dice').should('not.be.visible')

    cy.get('#svg_viewport').should('be.visible').then(vp => {
      assert.equal(vp[0].instance.type, 'svg')
      assert.equal(vp.length, 1)
    })

    cy.get('#svg_table svg').should('be.visible')
    cy.get('#svg_viewport [data-app-url="svg/v1/dice_d6.svg"]').should('be.visible')

  });
});




