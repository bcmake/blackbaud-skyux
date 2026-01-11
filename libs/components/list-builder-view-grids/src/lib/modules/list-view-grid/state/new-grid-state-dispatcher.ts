import { Injectable } from '@angular/core';
import { SkyGridColumnModel } from '@skyux/grids';
import { AsyncList } from '@skyux/list-builder-common';

import { NewGridState } from './new-grid-state';

/**
 * Dispatcher for the new grid state architecture.
 * Works directly with BehaviorSubjects instead of using action/orchestrator pattern.
 *
 * This replaces the action dispatch pattern:
 * ```typescript
 * this.gridDispatcher.next(new ListViewGridColumnsLoadAction(columns, true));
 * ```
 * With direct method calls:
 * ```typescript
 * this.gridDispatcher.loadColumns(columns, true);
 * ```
 *
 * @internal
 */
@Injectable()
export class NewGridStateDispatcher {
  constructor(private gridState: NewGridState) {}

  /**
   * Load columns into the grid state.
   * Replaces `ListViewGridColumnsLoadAction` dispatch pattern.
   * @param columns The column models to load.
   * @param refresh Whether to refresh (replace) existing columns. If false, columns are appended.
   */
  public loadColumns(columns: SkyGridColumnModel[], refresh = false): void {
    const currentColumns = this.gridState.getCurrentColumns();

    const newAsyncList = new AsyncList<SkyGridColumnModel>(
      refresh ? columns : [...currentColumns.items, ...columns],
      Date.now(),
      false,
      refresh ? columns.length : currentColumns.items.length + columns.length
    );

    this.gridState.updateColumns(newAsyncList);
  }

  /**
   * Load displayed columns into the grid state.
   * Replaces `ListViewDisplayedGridColumnsLoadAction` dispatch pattern.
   * @param columns The displayed column models to load.
   * @param refresh Whether to refresh (replace) existing displayed columns. If false, columns are appended.
   */
  public loadDisplayedColumns(
    columns: SkyGridColumnModel[],
    refresh = false
  ): void {
    const currentDisplayedColumns = this.gridState.getCurrentDisplayedColumns();

    const newAsyncList = new AsyncList<SkyGridColumnModel>(
      refresh ? columns : [...currentDisplayedColumns.items, ...columns],
      Date.now(),
      false,
      refresh
        ? columns.length
        : currentDisplayedColumns.items.length + columns.length
    );

    this.gridState.updateDisplayedColumns(newAsyncList);
  }

  /**
   * Update a single column's properties.
   * @param columnId The ID of the column to update.
   * @param updates Partial column model with properties to update.
   */
  public updateColumn(
    columnId: string,
    updates: Partial<SkyGridColumnModel>
  ): void {
    const currentColumns = this.gridState.getCurrentColumns();
    const updatedItems = currentColumns.items.map((col) => {
      if (col.id === columnId) {
        return { ...col, ...updates } as SkyGridColumnModel;
      }
      return col;
    });

    const newAsyncList = new AsyncList<SkyGridColumnModel>(
      updatedItems,
      Date.now(),
      false,
      updatedItems.length
    );

    this.gridState.updateColumns(newAsyncList);
  }

  /**
   * Update a single displayed column's properties.
   * @param columnId The ID of the displayed column to update.
   * @param updates Partial column model with properties to update.
   */
  public updateDisplayedColumn(
    columnId: string,
    updates: Partial<SkyGridColumnModel>
  ): void {
    const currentDisplayedColumns = this.gridState.getCurrentDisplayedColumns();
    const updatedItems = currentDisplayedColumns.items.map((col) => {
      if (col.id === columnId) {
        return { ...col, ...updates } as SkyGridColumnModel;
      }
      return col;
    });

    const newAsyncList = new AsyncList<SkyGridColumnModel>(
      updatedItems,
      Date.now(),
      false,
      updatedItems.length
    );

    this.gridState.updateDisplayedColumns(newAsyncList);
  }
}
