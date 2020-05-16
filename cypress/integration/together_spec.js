describe('Expanding the Menu', () => {
  it('Pops up the modal', () => {

    cy.visit('/')

    cy.get('#buttongroup_player summary').click()

    cy.contains('Go Multiplayer').should('be.visible')
  });
});

describe('Go Multiplayer', () => {
  before(() => {
    cy.visit('/')
  })
  it('Pops up the modal', () => {

    cy.get('#buttongroup_player summary').click()

    cy.contains('Go Multiplayer').should('be.visible')
  });
  it('Clicks the button', () => {
    cy.clearLocalStorage(/prop1|2/).then((ls) => {
      expect(ls.getItem('prop1')).to.be.null
      // HACK
      ls.setItem('togetherjs.settings.seenIntroDialog', true)
    })


    cy.contains('Go Multiplayer').click().should(() => {
      expect(true)
    })
    cy.contains('Share URL').should('be.visible')
  });
});


