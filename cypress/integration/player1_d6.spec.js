describe('Player 1', () => {
  before(() => {
    cy.visit('/')
  })
  it('Starts the room', () => {
    cy.clearLocalStorage().then((ls) => {
      // HACK
      ls.setItem('togetherjs.settings.seenIntroDialog', true)
    })

    cy.get('#svg_table svg').should('not.be.visible')
    cy.get('#svg_viewport [data-app-url="svg/v1/dice_d6.svg"]').should('not.be.visible')

    cy.contains('Player')
    cy.get('#profile_button').click()
    cy.get('#profile_input_name').type('cy')
    cy.get('#dialog_profile_submit').click()

    cy.contains('Multiplayer').click().should(() => {
      expect(true)
    })
    cy.contains('Share URL', { timeout: 5000 }).should('be.visible')

    //Cypress.config('defaultCommandTimeout', 10000)
    // Player 2 should be doing their thing right now...

    cy.get('#svg_table svg', { timeout: 10000 }).should('be.visible')
    cy.get('#svg_viewport [data-app-url="svg/v1/dice_d6.svg"]',
      { timeout: 10000 }
    ).should('be.visible')
  });
});



