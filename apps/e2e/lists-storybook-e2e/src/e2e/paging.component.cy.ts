import { E2eVariations } from '@skyux-sdk/e2e-schematics';

describe('lists-storybook - paging', () => {
  E2eVariations.forEachTheme((theme) => {
    describe(`in ${theme} theme`, () => {
      beforeEach(() =>
        cy.visit(
          `/iframe.html?globals=theme:${theme}&id=pagingcomponent-paging--paging`,
        ),
      );
      it('should render the component', () => {
        cy.skyReady('app-paging').screenshot(
          `pagingcomponent-paging--paging-${theme}`,
        );
        cy.get('app-paging').percySnapshot(
          `pagingcomponent-paging--paging-${theme}`,
          {
            widths: E2eVariations.DISPLAY_WIDTHS,
          },
        );
      });

      it('should render paging button in hover state', () => {
        cy.skyReady('app-paging');
        cy.get('.sky-paging-btn').eq(1).trigger('mouseover');
        cy.get('app-paging').screenshot(
          `pagingcomponent-paging--paging-${theme}-button-hover`,
        );
        cy.get('app-paging').percySnapshot(
          `pagingcomponent-paging--paging-${theme}-button-hover`,
          {
            widths: E2eVariations.DISPLAY_WIDTHS,
          },
        );
      });

      it('should render paging button in focus state', () => {
        cy.skyReady('app-paging');
        cy.get('.sky-paging-btn').eq(1).focus();
        cy.get('app-paging').screenshot(
          `pagingcomponent-paging--paging-${theme}-button-focus`,
        );
        cy.get('app-paging').percySnapshot(
          `pagingcomponent-paging--paging-${theme}-button-focus`,
          {
            widths: E2eVariations.DISPLAY_WIDTHS,
          },
        );
      });

      it('should render paging after navigation', () => {
        cy.skyReady('app-paging');
        cy.get('.sky-paging-btn').eq(2).click();
        cy.get('app-paging').screenshot(
          `pagingcomponent-paging--paging-${theme}-navigated`,
        );
        cy.get('app-paging').percySnapshot(
          `pagingcomponent-paging--paging-${theme}-navigated`,
          {
            widths: E2eVariations.DISPLAY_WIDTHS,
          },
        );
      });

      it('should render paging at mobile widths', () => {
        E2eVariations.MOBILE_WIDTHS.forEach((width) => {
          cy.viewport(width, 960);
          cy.skyReady('app-paging').screenshot(
            `pagingcomponent-paging--paging-${theme}-mobile-${width}`,
          );
          cy.get('app-paging').percySnapshot(
            `pagingcomponent-paging--paging-${theme}-mobile-${width}`,
            {
              widths: [width],
            },
          );
        });
      });
    });
  });
});
