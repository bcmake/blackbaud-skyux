import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

import { SkyGridColumnHarnessFilters } from './grid-column-harness-filters';

/**
 * Harness for interacting with a grid column header in tests.
 */
export class SkyGridColumnHarness extends ComponentHarness {
  /**
   * @internal
   */
  public static hostSelector = 'th.sky-grid-heading';

  #getHeaderText = this.locatorFor('.sky-grid-header-text');

  /**
   * Gets a `HarnessPredicate` that can be used to search for a
   * `SkyGridColumnHarness` that meets certain criteria.
   */
  public static with(
    filters: SkyGridColumnHarnessFilters,
  ): HarnessPredicate<SkyGridColumnHarness> {
    return new HarnessPredicate(SkyGridColumnHarness, filters)
      .addOption('columnId', filters.columnId, async (harness, columnId) => {
        const id = await harness.getColumnId();
        return await HarnessPredicate.stringMatches(id, columnId);
      })
      .addOption(
        'headingText',
        filters.headingText,
        async (harness, headingText) => {
          const text = await harness.getHeadingText();
          return await HarnessPredicate.stringMatches(text, headingText);
        },
      );
  }

  /**
   * Gets the column ID.
   */
  public async getColumnId(): Promise<string | null> {
    return await (await this.host()).getAttribute('sky-cmp-id');
  }

  /**
   * Gets the heading text of the column.
   */
  public async getHeadingText(): Promise<string> {
    return (await (await this.#getHeaderText()).text()).trim();
  }

  /**
   * Gets the sort direction of the column.
   * Returns 'ascending', 'descending', 'none', or null if not sortable.
   */
  public async getSortDirection(): Promise<string | null> {
    return await (await this.host()).getAttribute('aria-sort');
  }

  /**
   * Whether the column is sortable.
   */
  public async isSortable(): Promise<boolean> {
    const tabIndex = await (await this.host()).getAttribute('tabindex');
    return tabIndex === '0';
  }

  /**
   * Clicks the column header to sort by this column.
   */
  public async sort(): Promise<void> {
    if (!(await this.isSortable())) {
      throw new Error('Cannot sort by this column because it is not sortable.');
    }
    await (await this.host()).click();
  }
}
