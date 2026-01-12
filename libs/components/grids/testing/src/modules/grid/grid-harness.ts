import { HarnessPredicate } from '@angular/cdk/testing';
import { SkyComponentHarness } from '@skyux/core/testing';

import { SkyGridColumnHarness } from './grid-column-harness';
import { SkyGridColumnHarnessFilters } from './grid-column-harness-filters';
import { SkyGridHarnessFilters } from './grid-harness-filters';
import { SkyGridRowHarness } from './grid-row-harness';
import { SkyGridRowHarnessFilters } from './grid-row-harness-filters';

/**
 * Harness for interacting with a grid component in tests.
 */
export class SkyGridHarness extends SkyComponentHarness {
  /**
   * @internal
   */
  public static hostSelector = 'sky-grid';

  #getTable = this.locatorFor('.sky-grid-table');

  /**
   * Gets a `HarnessPredicate` that can be used to search for a
   * `SkyGridHarness` that meets certain criteria.
   */
  public static with(
    filters: SkyGridHarnessFilters,
  ): HarnessPredicate<SkyGridHarness> {
    return SkyGridHarness.getDataSkyIdPredicate(filters);
  }

  /**
   * Gets all column harnesses.
   */
  public async getColumns(): Promise<SkyGridColumnHarness[]> {
    return await this.locatorForAll(SkyGridColumnHarness)();
  }

  /**
   * Gets column harnesses matching the given filters.
   */
  public async getColumnsByFilter(
    filters: SkyGridColumnHarnessFilters,
  ): Promise<SkyGridColumnHarness[]> {
    return await this.locatorForAll(SkyGridColumnHarness.with(filters))();
  }

  /**
   * Gets a specific column harness by filter.
   */
  public async getColumn(
    filters: SkyGridColumnHarnessFilters,
  ): Promise<SkyGridColumnHarness> {
    return await this.locatorFor(SkyGridColumnHarness.with(filters))();
  }

  /**
   * Gets all row harnesses.
   */
  public async getRows(): Promise<SkyGridRowHarness[]> {
    return await this.locatorForAll(SkyGridRowHarness)();
  }

  /**
   * Gets row harnesses matching the given filters.
   */
  public async getRowsByFilter(
    filters: SkyGridRowHarnessFilters,
  ): Promise<SkyGridRowHarness[]> {
    return await this.locatorForAll(SkyGridRowHarness.with(filters))();
  }

  /**
   * Gets a specific row harness by filter.
   */
  public async getRow(filters: SkyGridRowHarnessFilters): Promise<SkyGridRowHarness> {
    return await this.locatorFor(SkyGridRowHarness.with(filters))();
  }

  /**
   * Gets the number of columns in the grid.
   */
  public async getColumnCount(): Promise<number> {
    const columns = await this.getColumns();
    return columns.length;
  }

  /**
   * Gets the number of rows in the grid.
   */
  public async getRowCount(): Promise<number> {
    const rows = await this.getRows();
    return rows.length;
  }

  /**
   * Whether the grid has multiselect enabled.
   */
  public async hasMultiselect(): Promise<boolean> {
    const multiselectCells = await this.locatorForAll(
      '.sky-grid-multiselect-cell',
    )();
    return multiselectCells.length > 0;
  }

  /**
   * Gets all selected rows (for multiselect grids).
   */
  public async getSelectedRows(): Promise<SkyGridRowHarness[]> {
    const rows = await this.getRows();
    const selectedRows: SkyGridRowHarness[] = [];
    for (const row of rows) {
      if (await row.isSelected()) {
        selectedRows.push(row);
      }
    }
    return selectedRows;
  }

  /**
   * Gets the highlighted row, or null if no row is highlighted.
   */
  public async getHighlightedRow(): Promise<SkyGridRowHarness | null> {
    const rows = await this.getRows();
    for (const row of rows) {
      if (await row.isHighlighted()) {
        return row;
      }
    }
    return null;
  }

  /**
   * Gets the fit mode of the grid ('width' or 'scroll').
   */
  public async getFitMode(): Promise<string> {
    const table = await this.#getTable();
    const hasFitClass = await table.hasClass('sky-grid-fit');
    return hasFitClass ? 'width' : 'scroll';
  }

  /**
   * Whether the grid has a toolbar.
   */
  public async hasToolbar(): Promise<boolean> {
    const table = await this.#getTable();
    return await table.hasClass('sky-grid-has-toolbar');
  }

  /**
   * Gets all column heading texts.
   */
  public async getColumnHeadingTexts(): Promise<string[]> {
    const columns = await this.getColumns();
    const texts: string[] = [];
    for (const column of columns) {
      texts.push(await column.getHeadingText());
    }
    return texts;
  }

  /**
   * Gets all column IDs.
   */
  public async getColumnIds(): Promise<(string | null)[]> {
    const columns = await this.getColumns();
    const ids: (string | null)[] = [];
    for (const column of columns) {
      ids.push(await column.getColumnId());
    }
    return ids;
  }

  /**
   * Sorts the grid by the specified column.
   * @param filters The filter criteria to find the column.
   */
  public async sortByColumn(filters: SkyGridColumnHarnessFilters): Promise<void> {
    const column = await this.getColumn(filters);
    await column.sort();
  }
}
