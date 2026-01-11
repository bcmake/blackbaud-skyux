import { Injectable } from '@angular/core';
import { SkyGridColumnModel } from '@skyux/grids';
import { AsyncList } from '@skyux/list-builder-common';

import { BehaviorSubject, Observable } from 'rxjs';

/**
 * New state management class that uses individual BehaviorSubjects for each state property.
 * This pattern allows direct subscription to individual state properties without timing issues
 * that occur with the "state object observable with static properties" pattern.
 * @internal
 */
@Injectable()
export class NewGridState {
  private displayedColumnsSubject = new BehaviorSubject<
    AsyncList<SkyGridColumnModel>
  >(new AsyncList<SkyGridColumnModel>([], 0));

  private columnsSubject = new BehaviorSubject<AsyncList<SkyGridColumnModel>>(
    new AsyncList<SkyGridColumnModel>([], 0),
  );

  public displayedColumns$: Observable<AsyncList<SkyGridColumnModel>> =
    this.displayedColumnsSubject.asObservable();

  public columns$: Observable<AsyncList<SkyGridColumnModel>> =
    this.columnsSubject.asObservable();

  public updateDisplayedColumns(columns: AsyncList<SkyGridColumnModel>): void {
    this.displayedColumnsSubject.next(columns);
  }

  public updateColumns(columns: AsyncList<SkyGridColumnModel>): void {
    this.columnsSubject.next(columns);
  }

  public getDisplayedColumnsSnapshot(): AsyncList<SkyGridColumnModel> {
    return this.displayedColumnsSubject.getValue();
  }

  public getColumnsSnapshot(): AsyncList<SkyGridColumnModel> {
    return this.columnsSubject.getValue();
  }
}
