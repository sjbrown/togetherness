describe('My First Test', function() {
  it('Visits the Home Page', function() {
    cy.visit('/')
  })

  it('Clicks the "+ Dice" button', function() {
    cy.visit('/')
    cy.get('#dialog_dice').should('not.be.visible')
    cy.get('#dice_dialog_button').click()
    cy.get('#dialog_dice').should('be.visible')
  })
})
