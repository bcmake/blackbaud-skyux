import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { expect } from '@skyux-sdk/testing';
import { SkyGridModule } from '@skyux/grids';

import { SkyGridHarness } from './grid-harness';

//#region Test Component
@Component({
  selector: 'sky-grid-test',
  template: `
    <sky-grid
      [data]="data"
      [enableMultiselect]="enableMultiselect"
      [selectedRowIds]="selectedRowIds"
      [rowHighlightedId]="rowHighlightedId"
    >
      <sky-grid-column field="name" heading="Name" />
      <sky-grid-column field="age" heading="Age" />
    </sky-grid>
    <sky-grid data-sky-id="other-grid" [data]="otherData">
      <sky-grid-column field="name" heading="Name" />
      <sky-grid-column field="age" heading="Age" />
    </sky-grid>
  `,
  standalone: false,
})
class TestComponent {
  public data = [
    { id: '1', name: 'John', age: 30 },
    { id: '2', name: 'Jane', age: 25 },
    { id: '3', name: 'Bob', age: 35 },
  ];

  public otherData = [{ id: '4', name: 'Alice', age: 28 }];

  public enableMultiselect = false;
  public selectedRowIds: string[] = [];
  public rowHighlightedId: string | undefined;
}
//#endregion Test Component

describe('Grid harness', () => {
  async function setupTest(options: { dataSkyId?: string } = {}): Promise<{
    gridHarness: SkyGridHarness;
    fixture: ComponentFixture<TestComponent>;
    loader: HarnessLoader;
  }> {
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [SkyGridModule],
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

    fixture.detectChanges();

    return { gridHarness, fixture, loader };
  }

  it('should get the grid from its data-sky-id', async () => {
    const { gridHarness } = await setupTest({
      dataSkyId: 'other-grid',
    });
    const rowCount = await gridHarness.getRowCount();
    expect(rowCount).toBe(1);
  });

  it('should get the column count', async () => {
    const { gridHarness } = await setupTest();
    const columnCount = await gridHarness.getColumnCount();
    expect(columnCount).toBe(2);
  });

  it('should get the column headings', async () => {
    const { gridHarness } = await setupTest();
    const headings = await gridHarness.getColumnHeadings();
    expect(headings.length).toBe(2);
  });

  it('should get the row count', async () => {
    const { gridHarness } = await setupTest();
    const rowCount = await gridHarness.getRowCount();
    expect(rowCount).toBe(3);
  });

  it('should get cell text', async () => {
    const { gridHarness } = await setupTest();
    const cellText = await gridHarness.getCellText(0, 0);
    expect(cellText).toBe('John');
  });

  it('should throw error for invalid row index when getting cell text', async () => {
    const { gridHarness } = await setupTest();
    await expectAsync(gridHarness.getCellText(10, 0)).toBeRejectedWithError(
      'Row index 10 is out of bounds. Grid has 3 rows.',
    );
  });

  it('should throw error for invalid column index when getting cell text', async () => {
    const { gridHarness } = await setupTest();
    await expectAsync(gridHarness.getCellText(0, 10)).toBeRejectedWithError(
      'Column index 10 is out of bounds. Row has 2 columns.',
    );
  });

  it('should check if multiselect is enabled', async () => {
    const { gridHarness, fixture } = await setupTest();
    expect(await gridHarness.hasMultiselect()).toBe(false);

    fixture.componentInstance.enableMultiselect = true;
    fixture.detectChanges();

    expect(await gridHarness.hasMultiselect()).toBe(true);
  });

  it('should check if row is selected', async () => {
    const { gridHarness, fixture } = await setupTest();
    fixture.componentInstance.enableMultiselect = true;
    fixture.componentInstance.selectedRowIds = ['1'];
    fixture.detectChanges();

    expect(await gridHarness.isRowSelected(0)).toBe(true);
    expect(await gridHarness.isRowSelected(1)).toBe(false);
  });

  it('should throw error for invalid row index when checking selection', async () => {
    const { gridHarness } = await setupTest();
    await expectAsync(gridHarness.isRowSelected(10)).toBeRejectedWithError(
      'Row index 10 is out of bounds. Grid has 3 rows.',
    );
  });

  it('should check if row is highlighted', async () => {
    const { gridHarness, fixture } = await setupTest();
    fixture.componentInstance.rowHighlightedId = '2';
    fixture.detectChanges();

    expect(await gridHarness.isRowHighlighted(0)).toBe(false);
    expect(await gridHarness.isRowHighlighted(1)).toBe(true);
  });

  it('should throw error for invalid row index when checking highlight', async () => {
    const { gridHarness } = await setupTest();
    await expectAsync(gridHarness.isRowHighlighted(10)).toBeRejectedWithError(
      'Row index 10 is out of bounds. Grid has 3 rows.',
    );
  });

  it('should click a row', async () => {
    const { gridHarness } = await setupTest();
    await gridHarness.clickRow(0);
  });

  it('should throw error for invalid row index when clicking', async () => {
    const { gridHarness } = await setupTest();
    await expectAsync(gridHarness.clickRow(10)).toBeRejectedWithError(
      'Row index 10 is out of bounds. Grid has 3 rows.',
    );
  });

  it('should click a column header', async () => {
    const { gridHarness } = await setupTest();
    await gridHarness.clickColumnHeader(0);
  });

  it('should throw error for invalid column index when clicking header', async () => {
    const { gridHarness } = await setupTest();
    await expectAsync(gridHarness.clickColumnHeader(10)).toBeRejectedWithError(
      'Column index 10 is out of bounds. Grid has 2 columns.',
    );
  });
});
