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

    cy.wait(2000) // Player 1 will be doing their thing now...

    cy.get('#buttongroup_player summary').click()
    cy.contains('Go Multiplayer').click().should(() => {
      expect(true)
    })
    cy.contains('Share URL').should('be.visible')

    cy.contains('+ Dice').click()

    cy.get('#dice_input_d6').type('{selectall}1')
      .should('have.value', '1')

    cy.get('#dialog_submit_standard').click()
    cy.wait(400)

    cy.get('#svg_table svg').should('be.visible')
    cy.get('#svg_viewport [data-app-url="svg/v1/dice_d6.svg"]').should('be.visible')

  });
});
