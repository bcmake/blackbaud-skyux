import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

import { SkyGridRowHarnessFilters } from './grid-row-harness-filters';

/**
 * Harness for interacting with a grid row in tests.
 */
export class SkyGridRowHarness extends ComponentHarness {
  /**
   * @internal
   */
  public static hostSelector = 'tr.sky-grid-row';

  #getCheckbox = this.locatorForOptional('sky-checkbox input[type="checkbox"]');
  #getCells = this.locatorForAll('td.sky-grid-cell');

  /**
   * Gets a `HarnessPredicate` that can be used to search for a
   * `SkyGridRowHarness` that meets certain criteria.
   */
  public static with(
    filters: SkyGridRowHarnessFilters,
  ): HarnessPredicate<SkyGridRowHarness> {
    return new HarnessPredicate(SkyGridRowHarness, filters).addOption(
      'rowId',
      filters.rowId,
      async (harness, rowId) => {
        const id = await harness.getRowId();
        return await HarnessPredicate.stringMatches(id, rowId);
      },
    );
  }

  /**
   * Gets the row ID.
   */
  public async getRowId(): Promise<string | null> {
    return await (await this.host()).getAttribute('sky-cmp-id');
  }

  /**
   * Gets the text content of all cells in the row.
   */
  public async getCellTexts(): Promise<string[]> {
    const cells = await this.#getCells();
    const texts: string[] = [];
    for (const cell of cells) {
      texts.push((await cell.text()).trim());
    }
    return texts;
  }

  /**
   * Gets the text content of a specific cell by index.
   */
  public async getCellText(index: number): Promise<string> {
    const cells = await this.#getCells();
    if (index < 0 || index >= cells.length) {
      throw new Error(
        `Cell index ${index} is out of bounds. Row has ${cells.length} cells.`,
      );
    }
    return (await cells[index].text()).trim();
  }

  /**
   * Whether the row is highlighted.
   */
  public async isHighlighted(): Promise<boolean> {
    const ariaCurrent = await (await this.host()).getAttribute('aria-current');
    return ariaCurrent === 'true';
  }

  /**
   * Whether the row is selected (for multiselect grids).
   */
  public async isSelected(): Promise<boolean> {
    const host = await this.host();
    return await host.hasClass('sky-grid-multiselect-selected-row');
  }

  /**
   * Whether the row has multiselect enabled.
   */
  public async isSelectable(): Promise<boolean> {
    const checkbox = await this.#getCheckbox();
    return checkbox !== null;
  }

  /**
   * Selects the row (for multiselect grids).
   */
  public async select(): Promise<void> {
    if (!(await this.isSelectable())) {
      throw new Error(
        'Cannot select this row because multiselect is not enabled.',
      );
    }
    if (await this.isSelected()) {
      return;
    }
    await (await this.host()).click();
  }

  /**
   * Deselects the row (for multiselect grids).
   */
  public async deselect(): Promise<void> {
    if (!(await this.isSelectable())) {
      throw new Error(
        'Cannot deselect this row because multiselect is not enabled.',
      );
    }
    if (!(await this.isSelected())) {
      return;
    }
    await (await this.host()).click();
  }

  /**
   * Clicks the row.
   */
  public async click(): Promise<void> {
    await (await this.host()).click();
  }
}
