import { E2eVariations } from '@skyux-sdk/e2e-schematics';

describe(`tabs-storybook`, () => {
  E2eVariations.forEachTheme((theme) => {
    describe(`in ${theme} theme`, () => {
      describe('default tabs', () => {
        beforeEach(() =>
          cy.visit(
            `/iframe.html?globals=theme:${theme}&id=tabscomponent-tabs--tabs`,
          ),
        );
        it('should render the component', () => {
          cy.skyReady('app-tabs').screenshot(
            `tabscomponent-tabs--tabs-${theme}`,
          );
          cy.get('app-tabs').percySnapshot(`tabscomponent-tabs--tabs-${theme}`);
        });
      });

      describe('dropdown tabs', () => {
        beforeEach(() =>
          cy.visit(
            `/iframe.html?globals=theme:${theme}&id=tabscomponent-tabs--tabs-dropdown`,
          ),
        );
        it('should render the component', () => {
          cy.skyReady('app-tabs')
            .get('sky-dropdown')
            .should('exist')
            .should('be.visible')
            .screenshot(`tabscomponent-tabs--tabs-dropdown-${theme}`);
          cy.get('sky-dropdown').percySnapshot(
            `tabscomponent-tabs--tabs-dropdown-${theme}`,
          );
        });
        it('should render the component - open', () => {
          cy.skyReady('app-tabs')
            .get('.sky-dropdown-button')
            .should('exist')
            .should('be.visible')
            .click();
          cy.get('app-tabs')
            .should('exist')
            .should('be.visible')
            .screenshot(`tabscomponent-tabs--tabs-dropdown-open-${theme}`);
          cy.get('app-tabs').percySnapshot(
            `tabscomponent-tabs--tabs-dropdown-open-${theme}`,
          );
        });
      });

      describe('tab navigation states', () => {
        beforeEach(() =>
          cy.visit(
            `/iframe.html?globals=theme:${theme}&id=tabscomponent-tabs--tabs`,
          ),
        );

        it('should render tab in hover state', () => {
          cy.skyReady('app-tabs');
          cy.get('.sky-btn-tab').eq(1).trigger('mouseover');
          cy.get('app-tabs').screenshot(
            `tabscomponent-tabs--tabs-${theme}-tab-hover`,
          );
          cy.get('app-tabs').percySnapshot(
            `tabscomponent-tabs--tabs-${theme}-tab-hover`,
            {
              widths: E2eVariations.DISPLAY_WIDTHS,
            },
          );
        });

        it('should render tab in focus state', () => {
          cy.skyReady('app-tabs');
          cy.get('.sky-btn-tab').eq(1).focus();
          cy.get('app-tabs').screenshot(
            `tabscomponent-tabs--tabs-${theme}-tab-focus`,
          );
          cy.get('app-tabs').percySnapshot(
            `tabscomponent-tabs--tabs-${theme}-tab-focus`,
            {
              widths: E2eVariations.DISPLAY_WIDTHS,
            },
          );
        });

        it('should render tabs after navigation', () => {
          cy.skyReady('app-tabs');
          cy.get('.sky-btn-tab').eq(1).click();
          cy.get('app-tabs').screenshot(
            `tabscomponent-tabs--tabs-${theme}-tab-navigated`,
          );
          cy.get('app-tabs').percySnapshot(
            `tabscomponent-tabs--tabs-${theme}-tab-navigated`,
            {
              widths: E2eVariations.DISPLAY_WIDTHS,
            },
          );
        });

        it('should render tabs at mobile widths', () => {
          E2eVariations.MOBILE_WIDTHS.forEach((width) => {
            cy.viewport(width, 960);
            cy.skyReady('app-tabs').screenshot(
              `tabscomponent-tabs--tabs-${theme}-mobile-${width}`,
            );
            cy.get('app-tabs').percySnapshot(
              `tabscomponent-tabs--tabs-${theme}-mobile-${width}`,
              {
                widths: [width],
              },
            );
          });
        });
      });
    });
  });
});
