import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SkyGridModule } from '@skyux/grids';

import { SkyGridColumnHarness } from './grid-column-harness';
import { SkyGridHarness } from './grid-harness';
import { SkyGridRowHarness } from './grid-row-harness';

//#region Test component
@Component({
  selector: 'sky-grid-test',
  template: `
    <sky-grid
      [data]="data"
      [enableMultiselect]="enableMultiselect"
      [fit]="fit"
      [hasToolbar]="hasToolbar"
      [rowHighlightedId]="rowHighlightedId"
      [selectedRowIds]="selectedRowIds"
      data-sky-id="test-grid"
    >
      <sky-grid-column
        id="name"
        field="name"
        heading="Name"
        [isSortable]="true"
      />
      <sky-grid-column
        id="email"
        field="email"
        heading="Email"
        [isSortable]="true"
      />
      <sky-grid-column
        id="amount"
        field="amount"
        heading="Amount"
        [isSortable]="false"
      />
    </sky-grid>
    <sky-grid [data]="data" data-sky-id="grid-2">
      <sky-grid-column id="name" field="name" heading="Name" />
      <sky-grid-column id="email" field="email" heading="Email" />
      <sky-grid-column id="amount" field="amount" heading="Amount" />
    </sky-grid>
  `,
  standalone: false,
})
class TestComponent {
  public data = [
    { id: '1', name: 'John Doe', email: 'john@example.com', amount: 100 },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', amount: 200 },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', amount: 300 },
  ];

  public enableMultiselect = false;
  public fit = 'width';
  public hasToolbar = false;
  public rowHighlightedId: string | undefined;
  public selectedRowIds: string[] = [];
}
//#endregion Test component

describe('Grid harness', () => {
  async function setupTest(options: { dataSkyId?: string } = {}): Promise<{
    gridHarness: SkyGridHarness;
    fixture: ComponentFixture<TestComponent>;
    loader: HarnessLoader;
  }> {
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [SkyGridModule, NoopAnimationsModule],
    }).compileComponents();

    const fixture = TestBed.createComponent(TestComponent);
    const loader = TestbedHarnessEnvironment.loader(fixture);

    let gridHarness: SkyGridHarness;

    if (options.dataSkyId) {
      gridHarness = await loader.getHarness(
        SkyGridHarness.with({
          dataSkyId: options.dataSkyId,
        }),
      );
    } else {
      gridHarness = await loader.getHarness(SkyGridHarness);
    }

    return { gridHarness, fixture, loader };
  }

  it('should get a grid by its data-sky-id property', async () => {
    const { gridHarness } = await setupTest({ dataSkyId: 'grid-2' });
    const columns = await gridHarness.getColumns();
    expect(columns.length).toBe(3);
  });

  describe('columns', () => {
    it('should get all columns', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const columns = await gridHarness.getColumns();
      expect(columns.length).toBe(3);
      expect(columns[0] instanceof SkyGridColumnHarness).toBeTrue();
    });

    it('should get column count', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const count = await gridHarness.getColumnCount();
      expect(count).toBe(3);
    });

    it('should get column heading texts', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const headings = await gridHarness.getColumnHeadingTexts();
      expect(headings).toEqual(['Name', 'Email', 'Amount']);
    });

    it('should get column IDs', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const ids = await gridHarness.getColumnIds();
      expect(ids).toEqual(['name', 'email', 'amount']);
    });

    it('should get columns by filter', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const columns = await gridHarness.getColumnsByFilter({
        columnId: 'name',
      });
      expect(columns.length).toBe(1);
      await expectAsync(columns[0].getColumnId()).toBeResolvedTo('name');
    });

    it('should get a specific column by filter', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const column = await gridHarness.getColumn({ headingText: 'Email' });
      await expectAsync(column.getHeadingText()).toBeResolvedTo('Email');
    });

    it('should return empty array when no columns match filter', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const columns = await gridHarness.getColumnsByFilter({
        columnId: 'nonexistent',
      });
      expect(columns).toEqual([]);
    });
  });

  describe('column harness', () => {
    it('should get column ID', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const columns = await gridHarness.getColumns();
      await expectAsync(columns[0].getColumnId()).toBeResolvedTo('name');
    });

    it('should get heading text', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const columns = await gridHarness.getColumns();
      await expectAsync(columns[0].getHeadingText()).toBeResolvedTo('Name');
    });

    it('should check if column is sortable', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const columns = await gridHarness.getColumns();
      await expectAsync(columns[0].isSortable()).toBeResolvedTo(true);
      await expectAsync(columns[2].isSortable()).toBeResolvedTo(false);
    });

    it('should get sort direction', async () => {
      const { gridHarness, fixture } = await setupTest({
        dataSkyId: 'test-grid',
      });
      fixture.detectChanges();
      const columns = await gridHarness.getColumns();
      const sortDirection = await columns[0].getSortDirection();
      expect(sortDirection === 'none' || sortDirection === null).toBeTrue();
    });

    it('should sort by column', async () => {
      const { gridHarness, fixture } = await setupTest({
        dataSkyId: 'test-grid',
      });
      fixture.detectChanges();
      const column = await gridHarness.getColumn({ columnId: 'name' });
      await column.sort();
      fixture.detectChanges();
      const sortDirection = await column.getSortDirection();
      expect(sortDirection).toBe('descending');
    });

    it('should throw error when sorting non-sortable column', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const column = await gridHarness.getColumn({ columnId: 'amount' });
      await expectAsync(column.sort()).toBeRejectedWithError(
        'Cannot sort by this column because it is not sortable.',
      );
    });

    it('should sort grid by column using grid harness method', async () => {
      const { gridHarness, fixture } = await setupTest({
        dataSkyId: 'test-grid',
      });
      fixture.detectChanges();
      await gridHarness.sortByColumn({ columnId: 'email' });
      fixture.detectChanges();
      const column = await gridHarness.getColumn({ columnId: 'email' });
      const sortDirection = await column.getSortDirection();
      expect(sortDirection).toBe('descending');
    });
  });

  describe('rows', () => {
    it('should get all rows', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const rows = await gridHarness.getRows();
      expect(rows.length).toBe(3);
      expect(rows[0] instanceof SkyGridRowHarness).toBeTrue();
    });

    it('should get row count', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const count = await gridHarness.getRowCount();
      expect(count).toBe(3);
    });

    it('should get rows by filter', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const rows = await gridHarness.getRowsByFilter({ rowId: '1' });
      expect(rows.length).toBe(1);
      await expectAsync(rows[0].getRowId()).toBeResolvedTo('1');
    });

    it('should get a specific row by filter', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const row = await gridHarness.getRow({ rowId: '2' });
      await expectAsync(row.getRowId()).toBeResolvedTo('2');
    });

    it('should return empty array when no rows match filter', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const rows = await gridHarness.getRowsByFilter({ rowId: 'nonexistent' });
      expect(rows).toEqual([]);
    });
  });

  describe('row harness', () => {
    it('should get row ID', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const rows = await gridHarness.getRows();
      await expectAsync(rows[0].getRowId()).toBeResolvedTo('1');
    });

    it('should get cell texts', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const rows = await gridHarness.getRows();
      const cellTexts = await rows[0].getCellTexts();
      expect(cellTexts).toEqual(['John Doe', 'john@example.com', '100']);
    });

    it('should get specific cell text by index', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const rows = await gridHarness.getRows();
      await expectAsync(rows[0].getCellText(0)).toBeResolvedTo('John Doe');
      await expectAsync(rows[0].getCellText(1)).toBeResolvedTo(
        'john@example.com',
      );
    });

    it('should throw error for out of bounds cell index', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const rows = await gridHarness.getRows();
      await expectAsync(rows[0].getCellText(10)).toBeRejectedWithError(
        'Cell index 10 is out of bounds. Row has 3 cells.',
      );
      await expectAsync(rows[0].getCellText(-1)).toBeRejectedWithError(
        'Cell index -1 is out of bounds. Row has 3 cells.',
      );
    });

    it('should click row', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const rows = await gridHarness.getRows();
      await rows[0].click();
    });
  });

  describe('row highlighting', () => {
    it('should check if row is highlighted', async () => {
      const { gridHarness, fixture } = await setupTest({
        dataSkyId: 'test-grid',
      });
      const rows = await gridHarness.getRows();
      await expectAsync(rows[0].isHighlighted()).toBeResolvedTo(false);

      fixture.componentInstance.rowHighlightedId = '1';
      fixture.detectChanges();

      await expectAsync(rows[0].isHighlighted()).toBeResolvedTo(true);
      await expectAsync(rows[1].isHighlighted()).toBeResolvedTo(false);
    });

    it('should get highlighted row', async () => {
      const { gridHarness, fixture } = await setupTest({
        dataSkyId: 'test-grid',
      });

      let highlightedRow = await gridHarness.getHighlightedRow();
      expect(highlightedRow).toBeNull();

      fixture.componentInstance.rowHighlightedId = '2';
      fixture.detectChanges();

      highlightedRow = await gridHarness.getHighlightedRow();
      expect(highlightedRow).not.toBeNull();
      if (highlightedRow) {
        await expectAsync(highlightedRow.getRowId()).toBeResolvedTo('2');
      }
    });
  });

  describe('multiselect', () => {
    it('should check if multiselect is enabled', async () => {
      const { gridHarness, fixture } = await setupTest({
        dataSkyId: 'test-grid',
      });
      await expectAsync(gridHarness.hasMultiselect()).toBeResolvedTo(false);

      fixture.componentInstance.enableMultiselect = true;
      fixture.detectChanges();

      await expectAsync(gridHarness.hasMultiselect()).toBeResolvedTo(true);
    });

    it('should check if row is selectable', async () => {
      const { gridHarness, fixture } = await setupTest({
        dataSkyId: 'test-grid',
      });
      const rows = await gridHarness.getRows();
      await expectAsync(rows[0].isSelectable()).toBeResolvedTo(false);

      fixture.componentInstance.enableMultiselect = true;
      fixture.detectChanges();

      const rowsWithMultiselect = await gridHarness.getRows();
      await expectAsync(rowsWithMultiselect[0].isSelectable()).toBeResolvedTo(
        true,
      );
    });

    it('should check if row is selected', async () => {
      const { gridHarness, fixture } = await setupTest({
        dataSkyId: 'test-grid',
      });
      fixture.componentInstance.enableMultiselect = true;
      fixture.detectChanges();

      const rows = await gridHarness.getRows();
      await expectAsync(rows[0].isSelected()).toBeResolvedTo(false);
    });

    it('should select and deselect row', async () => {
      const { gridHarness, fixture } = await setupTest({
        dataSkyId: 'test-grid',
      });
      fixture.componentInstance.enableMultiselect = true;
      fixture.detectChanges();

      const rows = await gridHarness.getRows();
      await expectAsync(rows[0].isSelected()).toBeResolvedTo(false);

      await rows[0].select();
      fixture.detectChanges();
      await expectAsync(rows[0].isSelected()).toBeResolvedTo(true);

      await rows[0].deselect();
      fixture.detectChanges();
      await expectAsync(rows[0].isSelected()).toBeResolvedTo(false);
    });

    it('should not re-select already selected row', async () => {
      const { gridHarness, fixture } = await setupTest({
        dataSkyId: 'test-grid',
      });
      fixture.componentInstance.enableMultiselect = true;
      fixture.componentInstance.selectedRowIds = ['1'];
      fixture.detectChanges();

      const rows = await gridHarness.getRows();
      await expectAsync(rows[0].isSelected()).toBeResolvedTo(true);

      await rows[0].select();
      fixture.detectChanges();
      await expectAsync(rows[0].isSelected()).toBeResolvedTo(true);
    });

    it('should not re-deselect already deselected row', async () => {
      const { gridHarness, fixture } = await setupTest({
        dataSkyId: 'test-grid',
      });
      fixture.componentInstance.enableMultiselect = true;
      fixture.detectChanges();

      const rows = await gridHarness.getRows();
      await expectAsync(rows[0].isSelected()).toBeResolvedTo(false);

      await rows[0].deselect();
      fixture.detectChanges();
      await expectAsync(rows[0].isSelected()).toBeResolvedTo(false);
    });

    it('should throw error when selecting non-selectable row', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const rows = await gridHarness.getRows();
      await expectAsync(rows[0].select()).toBeRejectedWithError(
        'Cannot select this row because multiselect is not enabled.',
      );
    });

    it('should throw error when deselecting non-selectable row', async () => {
      const { gridHarness } = await setupTest({ dataSkyId: 'test-grid' });
      const rows = await gridHarness.getRows();
      await expectAsync(rows[0].deselect()).toBeRejectedWithError(
        'Cannot deselect this row because multiselect is not enabled.',
      );
    });

    it('should get selected rows', async () => {
      const { gridHarness, fixture } = await setupTest({
        dataSkyId: 'test-grid',
      });
      fixture.componentInstance.enableMultiselect = true;
      fixture.componentInstance.selectedRowIds = ['1', '3'];
      fixture.detectChanges();

      const selectedRows = await gridHarness.getSelectedRows();
      expect(selectedRows.length).toBe(2);
      await expectAsync(selectedRows[0].getRowId()).toBeResolvedTo('1');
      await expectAsync(selectedRows[1].getRowId()).toBeResolvedTo('3');
    });

    it('should return empty array when no rows are selected', async () => {
      const { gridHarness, fixture } = await setupTest({
        dataSkyId: 'test-grid',
      });
      fixture.componentInstance.enableMultiselect = true;
      fixture.detectChanges();

      const selectedRows = await gridHarness.getSelectedRows();
      expect(selectedRows).toEqual([]);
    });
  });

  describe('grid properties', () => {
    it('should get fit mode', async () => {
      const { gridHarness, fixture } = await setupTest({
        dataSkyId: 'test-grid',
      });
      await expectAsync(gridHarness.getFitMode()).toBeResolvedTo('width');

      fixture.componentInstance.fit = 'scroll';
      fixture.detectChanges();

      await expectAsync(gridHarness.getFitMode()).toBeResolvedTo('scroll');
    });

    it('should check if grid has toolbar', async () => {
      const { gridHarness, fixture } = await setupTest({
        dataSkyId: 'test-grid',
      });
      await expectAsync(gridHarness.hasToolbar()).toBeResolvedTo(false);

      fixture.componentInstance.hasToolbar = true;
      fixture.detectChanges();

      await expectAsync(gridHarness.hasToolbar()).toBeResolvedTo(true);
    });
  });
});
