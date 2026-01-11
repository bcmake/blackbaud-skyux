import { E2eVariations } from '@skyux-sdk/e2e-schematics';

describe('forms-storybook - radio button', () => {
  E2eVariations.forEachTheme((theme) => {
    describe(`in ${theme} theme`, () => {
      beforeEach(() =>
        cy.visit(
          `/iframe.html?globals=theme:${theme}&id=radiobuttoncomponent-radiobutton--radio-button`,
        ),
      );

      it('should render the radio buttons', () => {
        cy.skyReady('app-radio-button');

        cy.get('.invalid-radio-button-group sky-radio-label').first().click();

        cy.get('app-radio-button').screenshot(
          `radiobuttoncomponent-radiobutton--radio-button-${theme}`,
        );

        cy.get('app-radio-button').percySnapshot(
          `radiobuttoncomponent-radiobutton--radio-button-${theme}`,
          {
            widths: E2eVariations.DISPLAY_WIDTHS,
          },
        );
      });

      it('should render radio button in focus state', () => {
        cy.skyReady('app-radio-button');
        cy.get('.sky-radio-input').first().focus();
        cy.get('app-radio-button').screenshot(
          `radiobuttoncomponent-radiobutton--radio-button-${theme}-focus`,
        );
        cy.get('app-radio-button').percySnapshot(
          `radiobuttoncomponent-radiobutton--radio-button-${theme}-focus`,
          {
            widths: E2eVariations.DISPLAY_WIDTHS,
          },
        );
      });

      it('should render radio button in hover state', () => {
        cy.skyReady('app-radio-button');
        cy.get('.sky-radio-input').first().trigger('mouseover');
        cy.get('app-radio-button').screenshot(
          `radiobuttoncomponent-radiobutton--radio-button-${theme}-hover`,
        );
        cy.get('app-radio-button').percySnapshot(
          `radiobuttoncomponent-radiobutton--radio-button-${theme}-hover`,
          {
            widths: E2eVariations.DISPLAY_WIDTHS,
          },
        );
      });

      it('should render radio button with validation error displayed', () => {
        cy.skyReady('app-radio-button');
        cy.get('.invalid-radio-button-group sky-radio-label').first().click();
        cy.get('.invalid-radio-button-group sky-form-error')
          .should('exist')
          .should('be.visible');
        cy.get('.invalid-radio-button-group').screenshot(
          `radiobuttoncomponent-radiobutton--radio-button-${theme}-validation-error`,
        );
        cy.get('.invalid-radio-button-group').percySnapshot(
          `radiobuttoncomponent-radiobutton--radio-button-${theme}-validation-error`,
          {
            widths: E2eVariations.DISPLAY_WIDTHS,
          },
        );
      });
    });
  });
});
