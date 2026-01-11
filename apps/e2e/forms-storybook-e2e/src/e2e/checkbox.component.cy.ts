import { E2eVariations } from '@skyux-sdk/e2e-schematics';

describe('forms-storybook - checkbox', () => {
  E2eVariations.forEachTheme((theme) => {
    describe(`in ${theme} theme`, () => {
      beforeEach(() =>
        cy.visit(
          `/iframe.html?globals=theme:${theme}&id=checkboxcomponent-checkbox--checkbox`,
        ),
      );

      it('should render the standard components', () => {
        cy.skyReady('app-checkbox');
        cy.get('#touched-required-checkbox .sky-switch').click();
        cy.get('#touched-required-checkbox .sky-switch').click();
        cy.get('#touched-required-checkbox input').blur();
        cy.get(
          '#touched-required-checkbox sky-form-error .sky-status-indicator-message',
        )
          .should('exist')
          .should('be.visible');
        cy.get('#touched-easy-mode-checkbox .sky-switch').click();
        cy.get('#touched-easy-mode-checkbox .sky-switch').click();
        cy.get('#touched-easy-mode-checkbox input').blur();
        cy.get(
          '#touched-easy-mode-checkbox sky-form-error .sky-status-indicator-message',
        )
          .should('exist')
          .should('be.visible');
        cy.get('app-checkbox')
          .get('#standard-checkboxes')
          .should('exist')
          .should('be.visible')
          .screenshot(`checkboxcomponent-checkbox--checkbox-${theme}-standard`);
        cy.skyVisualTest(
          `checkboxcomponent-checkbox--checkbox-${theme}-standard`,
          {
            overwrite: true,
          },
          '#standard-checkboxes',
        );
      });

      it('should render the icon components', () => {
        cy.skyReady('app-checkbox')
          .get('#icon-checkboxes')
          .should('exist')
          .should('be.visible')
          .screenshot(`checkboxcomponent-checkbox--checkbox-${theme}-icon`);
        cy.skyVisualTest(
          `checkboxcomponent-checkbox--checkbox-${theme}-icon`,
          {
            overwrite: true,
          },
          '#icon-checkboxes',
        );
      });

      it('should render checkbox group with validation error', () => {
        cy.skyReady('app-checkbox');
        cy.get('#touched-required-checkbox .sky-switch').click();
        cy.get('#touched-required-checkbox .sky-switch').click();
        cy.get('#touched-required-checkbox input').blur();
        cy.get(
          '#touched-required-checkbox sky-form-error .sky-status-indicator-message',
        )
          .should('exist')
          .should('be.visible');
        cy.get('#touched-required-checkbox').screenshot(
          `checkboxcomponent-checkbox--checkbox-${theme}-validation-error`,
        );
        cy.get('#touched-required-checkbox').percySnapshot(
          `checkboxcomponent-checkbox--checkbox-${theme}-validation-error`,
          {
            widths: E2eVariations.DISPLAY_WIDTHS,
          },
        );
      });

      it('should render checkbox in hover state', () => {
        cy.skyReady('app-checkbox');
        cy.get('#standard-checkboxes .sky-switch')
          .first()
          .should('exist')
          .should('be.visible')
          .trigger('mouseover');
        cy.get('#standard-checkboxes').screenshot(
          `checkboxcomponent-checkbox--checkbox-${theme}-hover`,
        );
        cy.get('#standard-checkboxes').percySnapshot(
          `checkboxcomponent-checkbox--checkbox-${theme}-hover`,
          {
            widths: E2eVariations.DISPLAY_WIDTHS,
          },
        );
      });

      it('should render checkbox in focus state', () => {
        cy.skyReady('app-checkbox');
        cy.get('#standard-checkboxes .sky-switch input').first().focus();
        cy.get('#standard-checkboxes').screenshot(
          `checkboxcomponent-checkbox--checkbox-${theme}-focus`,
        );
        cy.get('#standard-checkboxes').percySnapshot(
          `checkboxcomponent-checkbox--checkbox-${theme}-focus`,
          {
            widths: E2eVariations.DISPLAY_WIDTHS,
          },
        );
      });
    });
  });
});
