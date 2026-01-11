import { E2eVariations } from '@skyux-sdk/e2e-schematics';

describe('errors-storybook - error', () => {
  E2eVariations.forEachTheme((theme) => {
    describe(`in ${theme} theme`, () => {
      [
        'broken',
        'construction',
        'not-found',
        'security',
        'text-only',
        'custom-action',
        'custom-image',
        'custom-title-and-description-appended',
        'custom-title-and-description-replaced',
        'element',
      ].forEach((style) => {
        it(`should render the component (${style})`, () => {
          cy.visit(
            `/iframe.html?globals=theme:${theme}&id=errorcomponent-error--error-${style}`,
          );
          cy.skyReady('app-error').screenshot(
            `errorcomponent-error--error--${style}-${theme}`,
          );
          cy.get('app-error').percySnapshot(
            `errorcomponent-error--error--${style}-${theme}`,
            {
              widths: E2eVariations.DISPLAY_WIDTHS,
            },
          );
        });

        it(`should render the component (${style}) at mobile widths`, () => {
          E2eVariations.MOBILE_WIDTHS.forEach((width) => {
            cy.viewport(width, 960);
            cy.visit(
              `/iframe.html?globals=theme:${theme}&id=errorcomponent-error--error-${style}`,
            );
            cy.skyReady('app-error').screenshot(
              `errorcomponent-error--error--${style}-${theme}-mobile-${width}`,
            );
            cy.get('app-error').percySnapshot(
              `errorcomponent-error--error--${style}-${theme}-mobile-${width}`,
              {
                widths: [width],
              },
            );
          });
        });
      });

      it('should render error with action button in hover state', () => {
        cy.visit(
          `/iframe.html?globals=theme:${theme}&id=errorcomponent-error--error-custom-action`,
        );
        cy.skyReady('app-error');
        cy.get('.sky-error-action button').first().trigger('mouseover');
        cy.get('app-error').screenshot(
          `errorcomponent-error--error-custom-action-${theme}-button-hover`,
        );
        cy.get('app-error').percySnapshot(
          `errorcomponent-error--error-custom-action-${theme}-button-hover`,
          {
            widths: E2eVariations.DISPLAY_WIDTHS,
          },
        );
      });

      it('should render error with action button in focus state', () => {
        cy.visit(
          `/iframe.html?globals=theme:${theme}&id=errorcomponent-error--error-custom-action`,
        );
        cy.skyReady('app-error');
        cy.get('.sky-error-action button').first().focus();
        cy.get('app-error').screenshot(
          `errorcomponent-error--error-custom-action-${theme}-button-focus`,
        );
        cy.get('app-error').percySnapshot(
          `errorcomponent-error--error-custom-action-${theme}-button-focus`,
          {
            widths: E2eVariations.DISPLAY_WIDTHS,
          },
        );
      });
    });
  });
});
