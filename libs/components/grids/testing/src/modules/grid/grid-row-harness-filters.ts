import { BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * A set of criteria that can be used to filter a list of `SkyGridRowHarness` instances.
 */
export interface SkyGridRowHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose row ID matches the given value.
   */
  rowId?: string | RegExp;
}
