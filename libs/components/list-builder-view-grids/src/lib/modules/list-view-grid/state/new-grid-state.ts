import { Injectable } from '@angular/core';
import { SkyGridColumnModel } from '@skyux/grids';
import { AsyncList } from '@skyux/list-builder-common';

import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * New state management class that exposes individual observables instead of a single state object.
 * This pattern eliminates timing issues where state updates are consumed out of order,
 * removing the need for `scan` operator workarounds.
 *
 * Usage pattern changes from:
 * ```typescript
 * this.gridState.pipe(map(s => s.displayedColumns))
 * ```
 * To:
 * ```typescript
 * this.gridState.displayedColumns$
 * ```
 *
 * @internal
 */
@Injectable()
export class NewGridState {
  private readonly _columns$ = new BehaviorSubject<AsyncList<SkyGridColumnModel>>(
    new AsyncList<SkyGridColumnModel>()
  );

  private readonly _displayedColumns$ =
    new BehaviorSubject<AsyncList<SkyGridColumnModel>>(
      new AsyncList<SkyGridColumnModel>()
    );

  /**
   * Observable for the full columns AsyncList including metadata.
   */
  public readonly columns$: Observable<AsyncList<SkyGridColumnModel>> =
    this._columns$.asObservable();

  /**
   * Observable for the full displayedColumns AsyncList including metadata.
   */
  public readonly displayedColumns$: Observable<AsyncList<SkyGridColumnModel>> =
    this._displayedColumns$.asObservable();

  /**
   * Convenience observable for direct access to column items array.
   */
  public readonly columnItems$: Observable<SkyGridColumnModel[]> =
    this._columns$.pipe(map((asyncList) => asyncList.items));

  /**
   * Convenience observable for direct access to displayed column items array.
   */
  public readonly displayedColumnItems$: Observable<SkyGridColumnModel[]> =
    this._displayedColumns$.pipe(map((asyncList) => asyncList.items));

  /**
   * Updates the columns state.
   * @param columns The new columns AsyncList to set.
   */
  public updateColumns(columns: AsyncList<SkyGridColumnModel>): void {
    this._columns$.next(columns);
  }

  /**
   * Updates the displayed columns state.
   * @param displayedColumns The new displayed columns AsyncList to set.
   */
  public updateDisplayedColumns(
    displayedColumns: AsyncList<SkyGridColumnModel>
  ): void {
    this._displayedColumns$.next(displayedColumns);
  }

  /**
   * Gets the current columns value synchronously.
   * Use this when you need immediate access to the current state.
   */
  public getCurrentColumns(): AsyncList<SkyGridColumnModel> {
    return this._columns$.getValue();
  }

  /**
   * Gets the current displayed columns value synchronously.
   * Use this when you need immediate access to the current state.
   */
  public getCurrentDisplayedColumns(): AsyncList<SkyGridColumnModel> {
    return this._displayedColumns$.getValue();
  }
}
