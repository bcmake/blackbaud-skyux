import { Injectable } from '@angular/core';
import { SkyGridColumnModel } from '@skyux/grids';
import { AsyncList } from '@skyux/list-builder-common';

import { ListViewGridColumnsLoadAction } from './columns/load.action';
import { ListViewDisplayedGridColumnsLoadAction } from './displayed-columns/load.action';
import { NewGridState } from './new-grid-state';

/**
 * Union type for all grid state actions.
 * @internal
 */
export type NewGridStateAction =
  | ListViewGridColumnsLoadAction
  | ListViewDisplayedGridColumnsLoadAction;

/**
 * New dispatcher that works with individual BehaviorSubjects instead of state objects.
 * This dispatcher updates individual state properties through the NewGridState update methods.
 * @internal
 */
@Injectable()
export class NewGridStateDispatcher {
  constructor(private gridState: NewGridState) {}

  public next(action: NewGridStateAction): void {
    if (action instanceof ListViewDisplayedGridColumnsLoadAction) {
      this.handleDisplayedColumnsLoad(action);
    } else if (action instanceof ListViewGridColumnsLoadAction) {
      this.handleColumnsLoad(action);
    }
  }

  private handleDisplayedColumnsLoad(
    action: ListViewDisplayedGridColumnsLoadAction,
  ): void {
    const newColumns = action.columns.map(
      (g) => new SkyGridColumnModel(g.template, g),
    );

    if (action.refresh) {
      this.gridState.updateDisplayedColumns(
        new AsyncList<SkyGridColumnModel>([...newColumns], Date.now()),
      );
    } else {
      const currentState = this.gridState.getDisplayedColumnsSnapshot();
      this.gridState.updateDisplayedColumns(
        new AsyncList<SkyGridColumnModel>(
          [...currentState.items, ...newColumns],
          Date.now(),
        ),
      );
    }
  }

  private handleColumnsLoad(action: ListViewGridColumnsLoadAction): void {
    const newColumns = action.columns.map(
      (g) => new SkyGridColumnModel(g.template, g),
    );

    if (action.refresh) {
      this.gridState.updateColumns(
        new AsyncList<SkyGridColumnModel>([...newColumns], Date.now()),
      );
    } else {
      const currentState = this.gridState.getColumnsSnapshot();
      this.gridState.updateColumns(
        new AsyncList<SkyGridColumnModel>(
          [...currentState.items, ...newColumns],
          Date.now(),
        ),
      );
    }
  }
}
