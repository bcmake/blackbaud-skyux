import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { BaseStateService } from './base-state.service';

export interface GridItemModel {
  id: string;
  [key: string]: unknown;
}

@Injectable()
export class GridStateService extends BaseStateService {
  readonly #items$ = new BehaviorSubject<GridItemModel[]>([]);
  readonly #selectedIds$ = new BehaviorSubject<string[]>([]);
  readonly #isLoading$ = new BehaviorSubject<boolean>(false);

  public get items$(): Observable<GridItemModel[]> {
    return this.#items$.asObservable();
  }

  public get selectedIds$(): Observable<string[]> {
    return this.#selectedIds$.asObservable();
  }

  public get isLoading$(): Observable<boolean> {
    return this.#isLoading$.asObservable();
  }

  public updateItems(items: GridItemModel[]): void {
    this.#items$.next(items);
  }

  public updateSelectedIds(ids: string[]): void {
    this.#selectedIds$.next(ids);
  }

  public setLoading(loading: boolean): void {
    this.#isLoading$.next(loading);
  }

  public getCurrentItems(): GridItemModel[] {
    return this.#items$.value;
  }

  public getCurrentSelectedIds(): string[] {
    return this.#selectedIds$.value;
  }
}
