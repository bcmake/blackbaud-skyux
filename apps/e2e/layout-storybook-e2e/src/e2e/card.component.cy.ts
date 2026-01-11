import { E2eVariations } from '@skyux-sdk/e2e-schematics';

describe('layout-storybook - card', () => {
  E2eVariations.forEachTheme((theme) => {
    describe(`in ${theme} theme`, () => {
      beforeEach(() =>
        cy.visit(
          `/iframe.html?globals=theme:${theme}&id=cardcomponent-card--card`,
        ),
      );
      it('should render the component', () => {
        cy.skyReady('app-card').screenshot(`cardcomponent-card--card-${theme}`);
        cy.get('app-card').percySnapshot(`cardcomponent-card--card-${theme}`, {
          widths: E2eVariations.DISPLAY_WIDTHS,
        });
      });

      it('should render the component at mobile widths', () => {
        E2eVariations.MOBILE_WIDTHS.forEach((width) => {
          cy.viewport(width, 960);
          cy.skyReady('app-card').screenshot(
            `cardcomponent-card--card-${theme}-mobile-${width}`,
          );
          cy.get('app-card').percySnapshot(
            `cardcomponent-card--card-${theme}-mobile-${width}`,
            {
              widths: [width],
            },
          );
        });
      });

      it('should render the card in hover state', () => {
        cy.skyReady('app-card');
        cy.get('sky-card').first().trigger('mouseover');
        cy.get('app-card').screenshot(
          `cardcomponent-card--card-${theme}-hover`,
        );
        cy.get('app-card').percySnapshot(
          `cardcomponent-card--card-${theme}-hover`,
          {
            widths: E2eVariations.DISPLAY_WIDTHS,
          },
        );
      });
    });
  });
});
