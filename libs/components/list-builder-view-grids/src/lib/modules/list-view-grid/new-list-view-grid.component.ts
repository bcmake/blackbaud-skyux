import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChild,
  forwardRef,
} from '@angular/core';
import {
  SkyGridColumnComponent,
  SkyGridColumnDescriptionModelChange,
  SkyGridColumnHeadingModelChange,
  SkyGridColumnModel,
  SkyGridComponent,
  SkyGridMessage,
  SkyGridMessageType,
  SkyGridSelectedRowsModelChange,
  SkyGridSelectedRowsSource,
} from '@skyux/grids';
import {
  ListSearchModel,
  ListSelectedModel,
  ListState,
  ListStateDispatcher,
  ListViewComponent,
} from '@skyux/list-builder';
import {
  AsyncList,
  ListItemModel,
  ListSortFieldSelectorModel,
  getData,
  getValue,
  isObservable,
} from '@skyux/list-builder-common';

import { Observable, Subject, of as observableOf } from 'rxjs';
import {
  distinctUntilChanged,
  map as observableMap,
  take,
  takeUntil,
} from 'rxjs/operators';

import { ListViewGridColumnsLoadAction } from './state/columns/load.action';
import { ListViewDisplayedGridColumnsLoadAction } from './state/displayed-columns/load.action';
import { NewGridState } from './state/new-grid-state';
import { NewGridStateDispatcher } from './state/new-grid-state-dispatcher';
import { SkyListViewGridMessage } from './types/list-view-grid-message';
import { SkyListViewGridMessageType } from './types/list-view-grid-message-type';
import { SkyListViewGridRowDeleteCancelArgs } from './types/list-view-grid-row-delete-cancel-args';
import { SkyListViewGridRowDeleteConfirmArgs } from './types/list-view-grid-row-delete-confirm-args';

/**
 * New implementation of the list view grid component using the refactored state management pattern.
 * This component uses individual observable properties instead of a state object observable,
 * eliminating the need for scan operators to handle timing issues.
 * @internal
 */
@Component({
  selector: 'sky-new-list-view-grid',
  templateUrl: './list-view-grid.component.html',
  styleUrls: ['./list-view-grid.component.scss'],
  providers: [
    {
      provide: ListViewComponent,
      useExisting: forwardRef(() => NewSkyListViewGridComponent),
    },
    NewGridState,
    NewGridStateDispatcher,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class NewSkyListViewGridComponent
  extends ListViewComponent
  implements AfterContentInit, OnDestroy
{
  @Input()
  public set name(value: string) {
    this.viewName = value;
  }

  @Input()
  public displayedColumns: string[] | Observable<string[]>;

  @Input()
  public hiddenColumns: string[] | Observable<string[]>;

  @Input()
  public fit = 'width';

  @Input()
  public width: number | Observable<number>;

  @Input()
  public height: number | Observable<number>;

  @Input()
  public highlightSearchText = true;

  @Input()
  public set messageStream(stream: Subject<SkyListViewGridMessage>) {
    if (this._messageStream) {
      this._messageStream.unsubscribe();
    }

    this._messageStream = stream;

    this.initInlineDeleteMessages();
  }

  public get messageStream(): Subject<SkyListViewGridMessage> {
    return this._messageStream;
  }

  @Input()
  public rowHighlightedId: string;

  @Input()
  public enableMultiselect = false;

  @Input()
  public settingsKey: string;

  @Output()
  public rowDeleteCancel =
    new EventEmitter<SkyListViewGridRowDeleteCancelArgs>();

  @Output()
  public rowDeleteConfirm =
    new EventEmitter<SkyListViewGridRowDeleteConfirmArgs>();

  @Output()
  public selectedColumnIdsChange = new EventEmitter<string[]>();

  @ViewChild(SkyGridComponent)
  public gridComponent: SkyGridComponent;

  public get gridHeight(): Observable<number> {
    return typeof this.height === 'number'
      ? observableOf(this.height)
      : this.height;
  }

  public get gridWidth(): Observable<number> {
    return typeof this.width === 'number'
      ? observableOf(this.width)
      : this.width;
  }

  public columns: Observable<SkyGridColumnModel[]>;

  public selectedColumnIds: Observable<string[]>;

  public items: Observable<ListItemModel[]>;

  public gridMessageStream = new Subject<SkyGridMessage>();

  public loading: Observable<boolean>;

  public sortField: Observable<ListSortFieldSelectorModel>;

  public currentSearchText: Observable<string>;

  public multiselectSelectedIds: string[] = [];

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('search')
  public searchFunction: (data: any, searchText: string) => boolean;

  @ContentChildren(SkyGridColumnComponent)
  private columnComponents: QueryList<SkyGridColumnComponent>;

  private ngUnsubscribe = new Subject<void>();

  private _messageStream = new Subject<SkyListViewGridMessage>();

  constructor(
    state: ListState,
    private dispatcher: ListStateDispatcher,
    public gridState: NewGridState,
    public gridDispatcher: NewGridStateDispatcher,
  ) {
    super(state, 'Grid View');
  }

  public ngAfterContentInit(): void {
    this.state
      .pipe(
        observableMap((s) => s.selected.item),
        takeUntil(this.ngUnsubscribe),
        distinctUntilChanged(this.selectedMapEqual),
      )
      .subscribe((items: ListSelectedModel) => {
        const selectedIds: string[] = [];

        items.selectedIdMap.forEach((isSelected, id) => {
          if (items.selectedIdMap.get(id) === true) {
            selectedIds.push(id);
          }
        });

        this.multiselectSelectedIds = selectedIds;
      });

    if (this.columnComponents.length === 0) {
      throw new Error(
        'Grid view requires at least one sky-grid-column to render.',
      );
    }

    const columnModels = this.columnComponents.map((columnComponent) => {
      return new SkyGridColumnModel(columnComponent.template, columnComponent);
    });

    if (this.width && !isObservable(this.width)) {
      this.width = observableOf(this.width);
    }

    if (this.height && !isObservable(this.height)) {
      this.height = observableOf(this.height);
    }

    this.columns = this.gridState.columns$.pipe(
      observableMap((s) => s.items),
      distinctUntilChanged(this.arraysEqual),
      takeUntil(this.ngUnsubscribe),
    );

    this.selectedColumnIds = this.getSelectedIds();

    this.items = this.getGridItems();

    this.loading = this.state.pipe(
      observableMap((s) => {
        return s.items.loading;
      }),
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe),
    );

    this.sortField = this.state.pipe(
      observableMap((s) => {
        if (s.sort && s.sort.fieldSelectors) {
          return s.sort.fieldSelectors[0];
        }
        return undefined;
      }),
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe),
    );

    this.gridState.columns$
      .pipe(
        observableMap((s) => s.items),
        takeUntil(this.ngUnsubscribe),
        distinctUntilChanged(this.arraysEqual),
      )
      .subscribe((columns) => {
        if (this.hiddenColumns) {
          getValue(this.hiddenColumns, (hiddenColumns: string[]) => {
            this.gridDispatcher.next(
              new ListViewDisplayedGridColumnsLoadAction(
                columns.filter((x) => {
                  const id = x.id || x.field;
                  return hiddenColumns.indexOf(id) === -1;
                }),
                true,
              ),
            );
          });
        } else if (this.displayedColumns) {
          getValue(this.displayedColumns, (displayedColumns: string[]) => {
            this.gridDispatcher.next(
              new ListViewDisplayedGridColumnsLoadAction(
                columns.filter(
                  (x) => displayedColumns.indexOf(x.id || x.field) !== -1,
                ),
                true,
              ),
            );
          });
        } else {
          this.gridDispatcher.next(
            new ListViewDisplayedGridColumnsLoadAction(
              columns.filter((x) => !x.hidden),
              true,
            ),
          );
        }
      });

    this.currentSearchText = this.state.pipe(
      observableMap((s) => s.search.searchText),
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe),
    );

    this.gridDispatcher.next(
      new ListViewGridColumnsLoadAction(columnModels, true),
    );

    this.handleColumnChange();

    if (this.enableMultiselect) {
      this.dispatcher.toolbarShowMultiselectToolbar(true);
    }

    this.initInlineDeleteMessages();
  }

  public ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public onMultiselectSelectionChange(
    event: SkyGridSelectedRowsModelChange,
  ): void {
    if (
      event.source === SkyGridSelectedRowsSource.CheckboxChange ||
      event.source === SkyGridSelectedRowsSource.RowClick
    ) {
      this.state
        .pipe(
          observableMap((s) => s.items.items),
          take(1),
        )
        .subscribe((items: ListItemModel[]) => {
          const newItemIds = this.arrayIntersection(
            items.map((i) => i.id),
            this.multiselectSelectedIds,
          );
          const newIds = items.filter((i) => i.isSelected).map((i) => i.id);

          const deselectedIds = this.arrayDiff(newItemIds, newIds);
          if (deselectedIds.length > 0) {
            this.dispatcher.setSelected(deselectedIds, false);
          }

          const selectedIds = this.arrayDiff(newIds, newItemIds);
          if (selectedIds.length > 0) {
            this.dispatcher.setSelected(selectedIds, true);
          }
        });
    }
  }

  public columnIdsChanged(selectedColumnIds: string[]): void {
    this.selectedColumnIds.pipe(take(1)).subscribe((currentIds) => {
      if (!this.arraysEqual(selectedColumnIds, currentIds)) {
        this.gridState.columns$
          .pipe(
            observableMap((s) => s.items),
            take(1),
          )
          .subscribe((columns) => {
            const displayedColumns = selectedColumnIds.map(
              (columnId) => columns.filter((c) => c.id === columnId)[0],
            );
            this.gridDispatcher.next(
              new ListViewDisplayedGridColumnsLoadAction(
                displayedColumns,
                true,
              ),
            );
          });
      }
    });
  }

  public cancelRowDelete(args: SkyListViewGridRowDeleteCancelArgs): void {
    this.rowDeleteCancel.emit(args);
  }

  public confirmRowDelete(args: SkyListViewGridRowDeleteConfirmArgs): void {
    this.rowDeleteConfirm.emit(args);
  }

  public sortFieldChanged(sortField: ListSortFieldSelectorModel): void {
    this.dispatcher.sortSetFieldSelectors([sortField]);
  }

  public override onViewActive(): void {
    this.gridState.displayedColumns$
      .pipe(
        takeUntil(this.ngUnsubscribe),
        observableMap((s) => s.items),
        distinctUntilChanged(this.arraysEqual),
      )
      .subscribe((displayedColumns) => {
        const setFunctions =
          this.searchFunction !== undefined
            ? [this.searchFunction]
            : displayedColumns
                .map(
                  (column) =>
                    (data: any, searchText: string): any =>
                      column.searchFunction(
                        getData(data, column.field),
                        searchText,
                      ),
                )
                .filter((c) => c !== undefined);

        this.state.pipe(take(1)).subscribe((s) => {
          this.dispatcher.searchSetOptions(
            new ListSearchModel({
              searchText: s.search.searchText,
              functions: setFunctions,
              fieldSelectors: displayedColumns.map((d) => d.field),
            }),
          );
        });
      });
  }

  private initInlineDeleteMessages(): void {
    if (this.messageStream) {
      this.messageStream.subscribe((message: SkyListViewGridMessage) => {
        if (message.type === SkyListViewGridMessageType.AbortDeleteRow) {
          this.gridMessageStream.next({
            type: SkyGridMessageType.AbortDeleteRow,
            data: {
              abortDeleteRow: message.data.abortDeleteRow,
            },
          });
        } else if (
          message.type === SkyListViewGridMessageType.PromptDeleteRow
        ) {
          this.gridMessageStream.next({
            type: SkyGridMessageType.PromptDeleteRow,
            data: {
              promptDeleteRow: message.data.promptDeleteRow,
            },
          });
        }
      });
    }
  }

  private handleColumnChange(): void {
    this.columnComponents.changes
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((columnComponents) => {
        const columnModels = this.columnComponents.map((column) => {
          return new SkyGridColumnModel(column.template, column);
        });
        this.gridDispatcher.next(
          new ListViewGridColumnsLoadAction(columnModels, true),
        );
      });

    this.columnComponents.forEach((comp) => {
      comp.headingModelChanges
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe((change: SkyGridColumnHeadingModelChange) => {
          this.gridComponent.updateColumnHeading(change);
        });
      comp.descriptionModelChanges
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe((change: SkyGridColumnDescriptionModelChange) => {
          this.gridComponent.updateColumnDescription(change);
        });
    });
  }

  /**
   * Simplified getGridItems() without scan operator.
   * Directly subscribes to state items with distinctUntilChanged.
   */
  private getGridItems(): Observable<ListItemModel[]> {
    return this.state.pipe(
      observableMap((s) => s.items.items),
      distinctUntilChanged(this.arraysEqual),
      takeUntil(this.ngUnsubscribe),
    );
  }

  /**
   * Simplified getSelectedIds() without scan operator.
   * Directly subscribes to gridState.displayedColumns$ and maps to column IDs.
   */
  private getSelectedIds(): Observable<string[]> {
    return this.gridState.displayedColumns$.pipe(
      observableMap((result: AsyncList<SkyGridColumnModel>) => {
        return result.items.map((column: SkyGridColumnModel) => {
          return column.id || column.field;
        });
      }),
      distinctUntilChanged((previousValue: string[], newValue: string[]) => {
        return this.haveColumnIdsChanged(previousValue, newValue);
      }),
      takeUntil(this.ngUnsubscribe),
    );
  }

  private haveColumnIdsChanged(
    previousValue: string[],
    newValue: string[],
  ): boolean {
    if (previousValue.length !== newValue.length) {
      this.selectedColumnIdsChange.emit(newValue);
      return false;
    }

    for (let i = 0; i < previousValue.length; i++) {
      if (previousValue[i] !== newValue[i]) {
        this.selectedColumnIdsChange.emit(newValue);
        return false;
      }
    }
    return true;
  }

  private selectedMapEqual(
    prev: ListSelectedModel,
    next: ListSelectedModel,
  ): boolean {
    if (prev.selectedIdMap.size !== next.selectedIdMap.size) {
      return false;
    }

    const keys: string[] = [];
    next.selectedIdMap.forEach((value, key) => {
      keys.push(key);
    });

    for (const key of keys) {
      const value = next.selectedIdMap.get(key);
      if (value !== prev.selectedIdMap.get(key)) {
        return false;
      }
    }

    return true;
  }

  private arrayDiff(arrA: any[], arrB: any[]): any[] {
    return arrA.filter((i) => arrB.indexOf(i) < 0);
  }

  private arrayIntersection(arrA: any[], arrB: any[]): any[] {
    return arrA.filter((value) => -1 !== arrB.indexOf(value));
  }

  private arraysEqual(arrayA: any[], arrayB: any[]): boolean {
    return (
      arrayA.length === arrayB.length &&
      arrayA.every((value, index) => value === arrayB[index])
    );
  }
}
