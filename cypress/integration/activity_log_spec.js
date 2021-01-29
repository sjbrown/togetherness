describe('Activity Log', () => {
    beforeEach(() => {
        cy.visit('/')
    })
    it('begins empty', () => {
        cy.get('#activity_button').click()
        cy.get('#activity_log li').should('have.length', 0)
    })

    it('populates when actions are taken', () => {
        cy.get('#quick_die_button').click()
        cy.get('.d6_die').click()
        cy.get('#button-Roll').click()
        cy.get('#button-Roll').click()
        cy.get('#activity_button').click()
        cy.get('#activity_log li').should('have.length', 2)
        cy.get('#activity_log li').eq(1).find('.d6_die').should('have.length', 2)
    })
})