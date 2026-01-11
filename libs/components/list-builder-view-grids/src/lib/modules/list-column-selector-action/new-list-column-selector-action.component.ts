import {
  AfterContentInit,
  Component,
  EventEmitter,
  Input,
  Optional,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { SkyGridColumnModel } from '@skyux/grids';
import {
  ListState,
  ListStateDispatcher,
  ListToolbarItemModel,
  SkyListSecondaryActionsComponent,
} from '@skyux/list-builder';
import { SkyModalCloseArgs, SkyModalService } from '@skyux/modals';

import { Observable, combineLatest } from 'rxjs';
import {
  distinctUntilChanged,
  map as observableMap,
  take,
} from 'rxjs/operators';

import {
  SkyColumnSelectorContext,
  SkyColumnSelectorModel,
} from '../column-selector/column-selector-context';
import { SkyColumnSelectorComponent } from '../column-selector/column-selector-modal.component';
import { NewSkyListViewGridComponent } from '../list-view-grid/new-list-view-grid.component';

/**
 * Provides a column selector modal for a list grid view when placed in a list toolbar.
 * This component works with NewSkyListViewGridComponent and uses combineLatest
 * with individual state observables instead of subscribing to the entire state object.
 *
 * @internal
 */
@Component({
  selector: 'sky-new-list-column-selector-action',
  templateUrl: './list-column-selector-action.component.html',
  standalone: false,
})
export class NewSkyListColumnSelectorActionComponent
  implements AfterContentInit
{
  /**
   * Enables the column selector in the list toolbar. Set this attribute to the instance of
   * the `sky-new-list-view-grid` component using the component's template reference variable.
   */
  @Input()
  public gridView: NewSkyListViewGridComponent;

  /**
   * The `helpKey` string to associate with a help button in the grid header.
   */
  @Input()
  public helpKey: string;

  /**
   * Fires when users click the help button and broadcasts the `helpKey`.
   */
  @Output()
  public helpOpened = new EventEmitter<string>();

  @ViewChild('columnChooser', {
    static: true,
  })
  private columnChooserTemplate: TemplateRef<unknown>;

  private columnSelectorActionItemToolbarIndex = 7000;

  constructor(
    public listState: ListState,
    private modalService: SkyModalService,
    private dispatcher: ListStateDispatcher,
    @Optional() public secondaryActions: SkyListSecondaryActionsComponent
  ) {}

  public ngAfterContentInit(): void {
    if (!this.secondaryActions) {
      const columnChooserItem = new ListToolbarItemModel({
        id: 'column-chooser',
        template: this.columnChooserTemplate,
        location: 'left',
      });

      this.dispatcher.toolbarAddItems(
        [columnChooserItem],
        this.columnSelectorActionItemToolbarIndex
      );
    }
  }

  public get isInGridView(): Observable<boolean> {
    return this.listState.pipe(
      observableMap((s) => s.views.active),
      observableMap((activeView) => {
        return this.gridView && activeView === this.gridView.id;
      }),
      distinctUntilChanged()
    );
  }

  public get isInGridViewAndSecondary(): Observable<boolean> {
    return this.listState.pipe(
      observableMap((s) => s.views.active),
      observableMap((activeView) => {
        return (
          this.secondaryActions &&
          this.gridView &&
          activeView === this.gridView.id
        );
      }),
      distinctUntilChanged()
    );
  }

  /**
   * REFACTORED: Uses combineLatest with individual observables instead of
   * subscribing to the entire state object.
   */
  public openColumnSelector(): void {
    /* istanbul ignore else */
    /* sanity check */
    if (this.gridView) {
      // REFACTORED: Use combineLatest with individual observables
      combineLatest([
        this.gridView.gridState.columnItems$,
        this.gridView.gridState.displayedColumnItems$,
      ])
        .pipe(take(1))
        .subscribe(([columnItems, displayedColumnItems]) => {
          const columns: SkyColumnSelectorModel[] = columnItems
            .filter((item: SkyGridColumnModel) => !item.locked)
            .map((item: SkyGridColumnModel) => ({
              id: item.id,
              heading: item.heading,
              description: item.description,
            }));

          const selectedColumnIds: string[] = displayedColumnItems
            .filter((item: SkyGridColumnModel) => !item.locked)
            .map((item: SkyGridColumnModel) => item.id);

          this.openModal(columns, selectedColumnIds);
        });
    }
  }

  private openModal(
    columns: SkyColumnSelectorModel[],
    selectedColumnIds: string[]
  ): void {
    const modalInstance = this.modalService.open(SkyColumnSelectorComponent, {
      providers: [
        {
          provide: SkyColumnSelectorContext,
          useValue: {
            columns,
            selectedColumnIds,
          },
        },
      ],
      helpKey: this.helpKey,
    });

    modalInstance.helpOpened.subscribe((helpKey: string) => {
      this.helpOpened.emit(helpKey);
      this.helpOpened.complete();
    });

    modalInstance.closed.subscribe((result: SkyModalCloseArgs) => {
      if (result.reason === 'save' && result.data) {
        this.handleColumnSelection(result.data);
      }
    });
  }

  /**
   * REFACTORED: Uses new state observable and dispatcher method.
   */
  private handleColumnSelection(newSelectedIds: string[]): void {
    // Use columnItems$ observable to get current columns
    this.gridView.gridState.columnItems$.pipe(take(1)).subscribe((columnItems) => {
      const newDisplayedColumns = columnItems.filter((item) => {
        return newSelectedIds.indexOf(item.id) > -1 || item.locked;
      });
      // REFACTORED: Use new dispatcher method instead of action dispatch
      this.gridView.gridDispatcher.loadDisplayedColumns(newDisplayedColumns, true);
    });
  }
}
