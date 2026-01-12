import { BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * A set of criteria that can be used to filter a list of `SkyGridColumnHarness` instances.
 */
export interface SkyGridColumnHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose column ID matches the given value.
   */
  columnId?: string | RegExp;

  /**
   * Only find instances whose heading text matches the given value.
   */
  headingText?: string | RegExp;
}
