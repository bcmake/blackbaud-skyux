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
import { SkyLogService } from '@skyux/core';
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

import { NewGridStateDispatcher } from './state/new-grid-state-dispatcher';
import { NewGridState } from './state/new-grid-state';
import { SkyListViewGridMessage } from './types/list-view-grid-message';
import { SkyListViewGridMessageType } from './types/list-view-grid-message-type';
import { SkyListViewGridRowDeleteCancelArgs } from './types/list-view-grid-row-delete-cancel-args';
import { SkyListViewGridRowDeleteConfirmArgs } from './types/list-view-grid-row-delete-confirm-args';

/**
 * Displays a grid for a SKY UX-themed list of data using the new state architecture.
 * This component uses BehaviorSubject-based state management that eliminates timing issues
 * present in the original SkyListViewGridComponent.
 *
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
  /**
   * The name of the view.
   * @required
   */
  @Input()
  public set name(value: string) {
    this.viewName = value;
  }

  /**
   * The columns to display by default based on the ID or field of the item.
   */
  @Input()
  public displayedColumns: string[] | Observable<string[]>;

  /**
   * The columns to hide by default based on the ID or field of the item.
   */
  @Input()
  public hiddenColumns: string[] | Observable<string[]>;

  /**
   * How the grid fits to its parent.
   * @default "width"
   */
  @Input()
  public fit = 'width';

  /**
   * The width of the grid.
   */
  @Input()
  public width: number | Observable<number>;

  /**
   * The height of the grid.
   */
  @Input()
  public height: number | Observable<number>;

  /**
   * Whether to highlight search text within the grid.
   * @default true
   */
  @Input()
  public highlightSearchText = true;

  /**
   * The observable to send commands to the grid.
   */
  @Input()
  public set messageStream(stream: Subject<SkyListViewGridMessage>) {
    /* istanbul ignore else */
    if (this._messageStream) {
      this._messageStream.unsubscribe();
    }

    this._messageStream = stream;

    this.initInlineDeleteMessages();
  }

  public get messageStream(): Subject<SkyListViewGridMessage> {
    return this._messageStream;
  }

  /**
   * The ID of the row to highlight.
   */
  @Input()
  public rowHighlightedId: string;

  /**
   * Whether to enable the multiselect feature.
   * @default false
   */
  @Input()
  public enableMultiselect = false;

  /**
   * The unique key for the UI Config Service.
   */
  @Input()
  public settingsKey: string;

  /**
   * Fires when users cancel the deletion of a row.
   */
  @Output()
  public rowDeleteCancel =
    new EventEmitter<SkyListViewGridRowDeleteCancelArgs>();

  /**
   * Fires when users confirm the deletion of a row.
   */
  @Output()
  public rowDeleteConfirm =
    new EventEmitter<SkyListViewGridRowDeleteConfirmArgs>();

  /**
   * Fires when columns change.
   */
  @Output()
  public selectedColumnIdsChange = new EventEmitter<string[]>();

  @ViewChild(SkyGridComponent)
  public gridComponent: SkyGridComponent;

  public get gridHeight(): Observable<number> {
    /* istanbul ignore next */
    return typeof this.height === 'number'
      ? observableOf(this.height)
      : this.height;
  }

  public get gridWidth(): Observable<number> {
    /* istanbul ignore next */
    return typeof this.width === 'number'
      ? observableOf(this.width)
      : this.width;
  }

  public columns: Observable<SkyGridColumnModel[]>;

  public selectedColumnIds: Observable<string[]>;

  public items: Observable<ListItemModel[]>;

  /**
   * Message stream for communicating with the internal grid instance
   * @internal
   */
  public gridMessageStream = new Subject<SkyGridMessage>();

  public loading: Observable<boolean>;

  public sortField: Observable<ListSortFieldSelectorModel>;

  public currentSearchText: Observable<string>;

  public multiselectSelectedIds: string[] = [];

  /**
   * The search function to apply on the view data.
   */
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
    logger: SkyLogService
  ) {
    super(state, 'Grid View');

    logger.deprecated('NewSkyListViewGridComponent', {
      deprecationMajorVersion: 6,
      moreInfoUrl:
        'https://developer.blackbaud.com/skyux/components/data-entry-grid',
      replacementRecommendation: 'Use data entry grid instead.',
    });
  }

  public ngAfterContentInit(): void {
    // Watch for selection changes and update multiselectSelectedIds for local comparison.
    this.state
      .pipe(
        observableMap((s) => s.selected.item),
        takeUntil(this.ngUnsubscribe),
        distinctUntilChanged(this.selectedMapEqual)
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

    /* istanbul ignore next */
    if (this.columnComponents.length === 0) {
      throw new Error(
        'Grid view requires at least one sky-grid-column to render.'
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

    // Setup Observables for template - REFACTORED: Direct subscription without scan
    this.columns = this.gridState.columnItems$.pipe(
      distinctUntilChanged(this.arraysEqual),
      takeUntil(this.ngUnsubscribe)
    );

    this.selectedColumnIds = this.getSelectedIds();

    this.items = this.getGridItems();

    this.loading = this.state.pipe(
      observableMap((s) => {
        return s.items.loading;
      }),
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe)
    );

    this.sortField = this.state.pipe(
      observableMap((s) => {
        /* istanbul ignore else */
        /* sanity check */
        if (s.sort && s.sort.fieldSelectors) {
          return s.sort.fieldSelectors[0];
        }
        /* istanbul ignore next */
        /* sanity check */
        return undefined;
      }),
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe)
    );

    // REFACTORED: Use new state observable directly
    this.gridState.columnItems$
      .pipe(takeUntil(this.ngUnsubscribe), distinctUntilChanged(this.arraysEqual))
      .subscribe((columns) => {
        /* istanbul ignore else */
        if (this.hiddenColumns) {
          getValue(this.hiddenColumns, (hiddenColumns: string[]) => {
            this.gridDispatcher.loadDisplayedColumns(
              columns.filter((x) => {
                /* istanbul ignore next */
                /* sanity check */
                const id = x.id || x.field;
                return hiddenColumns.indexOf(id) === -1;
              }),
              true
            );
          });
        } else if (this.displayedColumns) {
          /* istanbul ignore next */
          getValue(this.displayedColumns, (displayedColumns: string[]) => {
            this.gridDispatcher.loadDisplayedColumns(
              columns.filter(
                (x) => displayedColumns.indexOf(x.id || x.field) !== -1
              ),
              true
            );
          });
        } else {
          this.gridDispatcher.loadDisplayedColumns(
            columns.filter((x) => !x.hidden),
            true
          );
        }
      });

    this.currentSearchText = this.state.pipe(
      observableMap((s) => s.search.searchText),
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe)
    );

    // REFACTORED: Use new dispatcher method
    this.gridDispatcher.loadColumns(columnModels, true);

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

  /**
   * If user makes selection, tell list-builder to update the list state.
   * This logic should only run on user interaction - NOT programmatic updates.
   */
  public onMultiselectSelectionChange(
    event: SkyGridSelectedRowsModelChange
  ): void {
    if (
      event.source === SkyGridSelectedRowsSource.CheckboxChange ||
      event.source === SkyGridSelectedRowsSource.RowClick
    ) {
      this.state
        .pipe(
          observableMap((s) => s.items.items),
          take(1)
        )
        .subscribe((items: ListItemModel[]) => {
          const newItemIds = this.arrayIntersection(
            items.map((i) => i.id),
            this.multiselectSelectedIds
          );
          const newIds = items.filter((i) => i.isSelected).map((i) => i.id);

          // Check for deselected ids & send message to dispatcher.
          const deselectedIds = this.arrayDiff(newItemIds, newIds);
          if (deselectedIds.length > 0) {
            this.dispatcher.setSelected(deselectedIds, false);
          }

          // Check for selected ids & send message to dispatcher.
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
        // REFACTORED: Use new state observable directly
        this.gridState.columnItems$.pipe(take(1)).subscribe((columns) => {
          const displayedColumns = selectedColumnIds.map(
            (columnId) => columns.filter((c) => c.id === columnId)[0]
          );
          // REFACTORED: Use new dispatcher method
          this.gridDispatcher.loadDisplayedColumns(displayedColumns, true);
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
    // REFACTORED: No more scan operator needed - direct subscription to displayedColumnItems$
    this.gridState.displayedColumnItems$
      .pipe(
        takeUntil(this.ngUnsubscribe),
        distinctUntilChanged(this.arraysEqual)
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
                        searchText
                      )
                )
                .filter((c) => c !== undefined);

        this.state.pipe(take(1)).subscribe((s) => {
          this.dispatcher.searchSetOptions(
            new ListSearchModel({
              searchText: s.search.searchText,
              functions: setFunctions,
              fieldSelectors: displayedColumns.map((d) => d.field),
            })
          );
        });
      });
  }

  private initInlineDeleteMessages(): void {
    /* istanbul ignore next */
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
    // watch for changes in column components
    this.columnComponents.changes
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        const columnModels = this.columnComponents.map((column) => {
          return new SkyGridColumnModel(column.template, column);
        });
        // REFACTORED: Use new dispatcher method
        this.gridDispatcher.loadColumns(columnModels, true);
      });

    // Watch for column heading changes:
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
   * REFACTORED: Removed scan operator workaround.
   * The new state architecture ensures updates are always in order.
   */
  private getGridItems(): Observable<ListItemModel[]> {
    return this.state.pipe(
      observableMap((s) => s.items.items),
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe)
    );
  }

  /**
   * REFACTORED: Removed scan operator workaround.
   * Direct subscription to displayedColumnItems$ from new state.
   */
  private getSelectedIds(): Observable<string[]> {
    return this.gridState.displayedColumnItems$.pipe(
      observableMap((columns: SkyGridColumnModel[]) => {
        /* istanbul ignore next */
        /* sanity check */
        return columns.map((column) => {
          return column.id || column.field;
        });
      }),
      distinctUntilChanged((previousValue: string[], newValue: string[]) => {
        return this.haveColumnIdsChanged(previousValue, newValue);
      }),
      takeUntil(this.ngUnsubscribe)
    );
  }

  private haveColumnIdsChanged(
    previousValue: string[],
    newValue: string[]
  ): boolean {
    if (previousValue.length !== newValue.length) {
      this.selectedColumnIdsChange.emit(newValue);
      return false;
    }

    for (let i = 0; i < previousValue.length; i++) {
      /* istanbul ignore if */
      if (previousValue[i] !== newValue[i]) {
        this.selectedColumnIdsChange.emit(newValue);
        return false;
      }
    }
    return true;
  }

  private selectedMapEqual(
    prev: ListSelectedModel,
    next: ListSelectedModel
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
