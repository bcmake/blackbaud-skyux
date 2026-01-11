import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface StateUpdate<T> {
  state: T;
  source: string;
  timestamp: number;
}

@Injectable()
export class StateDispatcherService<T> {
  readonly #stateUpdates = new Subject<StateUpdate<T>>();

  public getStateUpdates(sourceId: string): Observable<T> {
    return this.#stateUpdates.pipe(
      filter((update) => update.source !== sourceId),
      map((update) => update.state),
    );
  }

  public updateState(state: T, sourceId: string): void {
    this.#stateUpdates.next({
      state,
      source: sourceId,
      timestamp: Date.now(),
    });
  }
}
