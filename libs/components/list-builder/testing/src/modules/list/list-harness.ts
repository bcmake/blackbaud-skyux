import { HarnessPredicate } from '@angular/cdk/testing';
import { SkyComponentHarness } from '@skyux/core/testing';

import { SkyListHarnessFilters } from './list-harness-filters';

/**
 * Harness for interacting with a list component in tests.
 * @deprecated `SkyListComponent` and its features are deprecated. Use the data manager instead.
 */
export class SkyListHarness extends SkyComponentHarness {
  /**
   * @internal
   */
  public static hostSelector = 'sky-list';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a
   * `SkyListHarness` that meets certain criteria.
   */
  public static with(
    filters: SkyListHarnessFilters,
  ): HarnessPredicate<SkyListHarness> {
    return SkyListHarness.getDataSkyIdPredicate(filters);
  }

  /**
   * Gets the list's unique ID.
   */
  public async getId(): Promise<string | null> {
    const host = await this.host();
    return await host.getAttribute('id');
  }
}
