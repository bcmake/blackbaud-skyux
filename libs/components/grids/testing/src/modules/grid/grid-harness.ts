import { HarnessPredicate } from '@angular/cdk/testing';
import { SkyComponentHarness } from '@skyux/core/testing';

import { SkyGridHarnessFilters } from './grid-harness-filters';

/**
 * Harness for interacting with a grid component in tests.
 * @deprecated `SkyGridComponent` and its features are deprecated. Use the data grid instead.
 */
export class SkyGridHarness extends SkyComponentHarness {
  /**
   * @internal
   */
  public static hostSelector = 'sky-grid';

  #getRows = this.locatorForAll('tbody tr.sky-grid-row');
  #getHeaderCells = this.locatorForAll('th.sky-grid-heading');

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
   * Gets the number of columns in the grid.
   */
  public async getColumnCount(): Promise<number> {
    const headers = await this.#getHeaderCells();
    return headers.length;
  }

  /**
   * Gets the column headings from the grid.
   */
  public async getColumnHeadings(): Promise<string[]> {
    const headers = await this.#getHeaderCells();
    const headings: string[] = [];
    for (const header of headers) {
      const textElement = await header.getAttribute('sky-cmp-id');
      if (textElement) {
        const headerText = await header.text();
        headings.push(headerText.trim());
      }
    }
    return headings;
  }

  /**
   * Gets the number of rows in the grid.
   */
  public async getRowCount(): Promise<number> {
    const rows = await this.#getRows();
    return rows.length;
  }

  /**
   * Gets the text content of a specific cell.
   * @param rowIndex The zero-based row index.
   * @param columnIndex The zero-based column index.
   */
  public async getCellText(
    rowIndex: number,
    columnIndex: number,
  ): Promise<string> {
    const rows = await this.#getRows();
    if (rowIndex >= rows.length) {
      throw new Error(
        `Row index ${rowIndex} is out of bounds. Grid has ${rows.length} rows.`,
      );
    }
    const allCells = await this.locatorForAll(
      'tbody tr.sky-grid-row td.sky-grid-cell',
    )();
    const columnCount = await this.getColumnCount();
    const cellIndex = rowIndex * columnCount + columnIndex;
    if (columnIndex >= columnCount) {
      throw new Error(
        `Column index ${columnIndex} is out of bounds. Row has ${columnCount} columns.`,
      );
    }
    return (await allCells[cellIndex].text()).trim();
  }

  /**
   * Checks if the grid has multiselect enabled.
   */
  public async hasMultiselect(): Promise<boolean> {
    const multiselectCells = await this.locatorForAll(
      '.sky-grid-multiselect-cell',
    )();
    return multiselectCells.length > 0;
  }

  /**
   * Checks if a specific row is selected (for multiselect grids).
   * @param rowIndex The zero-based row index.
   */
  public async isRowSelected(rowIndex: number): Promise<boolean> {
    const rows = await this.#getRows();
    if (rowIndex >= rows.length) {
      throw new Error(
        `Row index ${rowIndex} is out of bounds. Grid has ${rows.length} rows.`,
      );
    }
    return await rows[rowIndex].hasClass('sky-grid-multiselect-selected-row');
  }

  /**
   * Checks if a specific row is highlighted.
   * @param rowIndex The zero-based row index.
   */
  public async isRowHighlighted(rowIndex: number): Promise<boolean> {
    const rows = await this.#getRows();
    if (rowIndex >= rows.length) {
      throw new Error(
        `Row index ${rowIndex} is out of bounds. Grid has ${rows.length} rows.`,
      );
    }
    return await rows[rowIndex].hasClass('sky-grid-row-highlight');
  }

  /**
   * Clicks on a specific row.
   * @param rowIndex The zero-based row index.
   */
  public async clickRow(rowIndex: number): Promise<void> {
    const rows = await this.#getRows();
    if (rowIndex >= rows.length) {
      throw new Error(
        `Row index ${rowIndex} is out of bounds. Grid has ${rows.length} rows.`,
      );
    }
    await rows[rowIndex].click();
  }

  /**
   * Clicks on a column header to sort by that column.
   * @param columnIndex The zero-based column index.
   */
  public async clickColumnHeader(columnIndex: number): Promise<void> {
    const headers = await this.#getHeaderCells();
    if (columnIndex >= headers.length) {
      throw new Error(
        `Column index ${columnIndex} is out of bounds. Grid has ${headers.length} columns.`,
      );
    }
    await headers[columnIndex].click();
  }
}
