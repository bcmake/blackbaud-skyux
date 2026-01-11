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
import { AsyncList } from '@skyux/list-builder-common';
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
import { ListViewDisplayedGridColumnsLoadAction } from '../list-view-grid/state/displayed-columns/load.action';
import { NewSkyListViewGridComponent } from '../list-view-grid/new-list-view-grid.component';

/**
 * New implementation of the column selector action component that works with
 * the refactored state management pattern using combineLatest for multiple observables.
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
  @Input()
  public gridView: NewSkyListViewGridComponent;

  @Input()
  public helpKey: string;

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
    @Optional() public secondaryActions: SkyListSecondaryActionsComponent,
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
        this.columnSelectorActionItemToolbarIndex,
      );
    }
  }

  public get isInGridView(): Observable<boolean> {
    return this.listState.pipe(
      observableMap((s) => s.views.active),
      observableMap((activeView) => {
        return this.gridView && activeView === this.gridView.id;
      }),
      distinctUntilChanged(),
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
      distinctUntilChanged(),
    );
  }

  /**
   * Opens the column selector modal using combineLatest to subscribe to
   * multiple observables from the new state pattern.
   */
  public openColumnSelector(): void {
    if (this.gridView) {
      combineLatest([
        this.gridView.gridState.columns$,
        this.gridView.gridState.displayedColumns$,
      ])
        .pipe(take(1))
        .subscribe(
          ([columns, displayedColumns]: [
            AsyncList<SkyGridColumnModel>,
            AsyncList<SkyGridColumnModel>,
          ]) => {
            const columnModels: SkyColumnSelectorModel[] = columns.items
              .filter((item: SkyGridColumnModel) => {
                return !item.locked;
              })
              .map((item: SkyGridColumnModel) => {
                return {
                  id: item.id,
                  heading: item.heading,
                  description: item.description,
                };
              });

            const selectedColumnIds: string[] = displayedColumns.items
              .filter((item: SkyGridColumnModel) => {
                return !item.locked;
              })
              .map((item: SkyGridColumnModel) => {
                return item.id;
              });

            const modalInstance = this.modalService.open(
              SkyColumnSelectorComponent,
              {
                providers: [
                  {
                    provide: SkyColumnSelectorContext,
                    useValue: {
                      columns: columnModels,
                      selectedColumnIds,
                    },
                  },
                ],
                helpKey: this.helpKey,
              },
            );

            modalInstance.helpOpened.subscribe((helpKey: string) => {
              this.helpOpened.emit(helpKey);
              this.helpOpened.complete();
            });

            modalInstance.closed.subscribe((result: SkyModalCloseArgs) => {
              if (result.reason === 'save' && result.data) {
                const newSelectedIds = result.data;
                this.gridView.gridState.columns$
                  .pipe(take(1))
                  .subscribe(
                    (columnsState: AsyncList<SkyGridColumnModel>) => {
                      const newDisplayedColumns = columnsState.items.filter(
                        (item) => {
                          return (
                            newSelectedIds.indexOf(item.id) > -1 || item.locked
                          );
                        },
                      );
                      this.gridView.gridDispatcher.next(
                        new ListViewDisplayedGridColumnsLoadAction(
                          newDisplayedColumns,
                          true,
                        ),
                      );
                    },
                  );
              }
            });
          },
        );
    }
  }
}
