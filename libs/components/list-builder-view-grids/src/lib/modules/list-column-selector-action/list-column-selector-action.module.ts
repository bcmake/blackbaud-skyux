import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SkyIconModule } from '@skyux/icon';
import {
  SkyListSecondaryActionsModule,
  SkyListToolbarModule,
} from '@skyux/list-builder';
import { SkyModalModule } from '@skyux/modals';

import { SkyColumnSelectorModule } from '../column-selector/column-selector-modal.module';
import { SkyListBuilderViewGridsResourcesModule } from '../shared/sky-list-builder-view-grids-resources.module';

import { SkyListColumnSelectorActionComponent } from './list-column-selector-action.component';
import { SkyListColumnSelectorButtonComponent } from './list-column-selector-button.component';
import { NewSkyListColumnSelectorActionComponent } from './new-list-column-selector-action.component';

/**
 * @deprecated List builder view grid and its features are deprecated. Use data entry grid instead. For more information, see https://developer.blackbaud.com/skyux/components/data-entry-grid.
 */
@NgModule({
  declarations: [
    SkyListColumnSelectorActionComponent,
    SkyListColumnSelectorButtonComponent,
    NewSkyListColumnSelectorActionComponent,
  ],
  imports: [
    CommonModule,
    SkyModalModule,
    SkyListBuilderViewGridsResourcesModule,
    SkyListSecondaryActionsModule,
    SkyListToolbarModule,
    SkyIconModule,
  ],
  exports: [
    SkyListColumnSelectorActionComponent,
    NewSkyListColumnSelectorActionComponent,
    SkyColumnSelectorModule,
  ],
})
export class SkyListColumnSelectorActionModule {}
