import { E2eVariations } from '@skyux-sdk/e2e-schematics';

describe('layout-storybook', () => {
  E2eVariations.forEachTheme((theme) => {
    describe(`in ${theme} theme`, () => {
      beforeEach(() =>
        cy.visit(
          `/iframe.html?globals=theme:${theme}&id=boxcomponent-box--box&args=showHelp:false;`,
        ),
      );
      it('should render the component', () => {
        cy.skyReady('app-box').screenshot(`boxcomponent-box--box-${theme}`);
        cy.get('app-box').percySnapshot(`boxcomponent-box--box-${theme}`, {
          widths: E2eVariations.DISPLAY_WIDTHS,
        });
      });

      it('should render the component at mobile widths', () => {
        E2eVariations.MOBILE_WIDTHS.forEach((width) => {
          cy.viewport(width, 960);
          cy.skyReady('app-box').screenshot(
            `boxcomponent-box--box-${theme}-mobile-${width}`,
          );
          cy.get('app-box').percySnapshot(
            `boxcomponent-box--box-${theme}-mobile-${width}`,
            {
              widths: [width],
            },
          );
        });
      });

      it('should render the box with context menu open', () => {
        cy.skyReady('app-box');
        cy.get('.sky-dropdown-button').first().click();
        cy.get('.sky-dropdown-menu').should('exist').should('be.visible');
        cy.get('app-box').screenshot(
          `boxcomponent-box--box-${theme}-context-menu-open`,
        );
        cy.get('app-box').percySnapshot(
          `boxcomponent-box--box-${theme}-context-menu-open`,
          {
            widths: E2eVariations.DISPLAY_WIDTHS,
          },
        );
      });
    });
  });
});
