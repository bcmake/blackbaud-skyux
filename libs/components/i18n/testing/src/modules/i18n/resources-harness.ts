import { HarnessPredicate } from '@angular/cdk/testing';
import { SkyComponentHarness } from '@skyux/core/testing';

import { SkyResourcesHarnessFilters } from './resources-harness-filters';

/**
 * Harness for interacting with elements that display localized resource strings in tests.
 * This harness can be used to verify that components correctly display localized content.
 */
export class SkyResourcesHarness extends SkyComponentHarness {
  /**
   * @internal
   */
  public static hostSelector = '[skyLibResources],[skyAppResources]';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a
   * `SkyResourcesHarness` that meets certain criteria.
   */
  public static with(
    filters: SkyResourcesHarnessFilters,
  ): HarnessPredicate<SkyResourcesHarness> {
    return SkyResourcesHarness.getDataSkyIdPredicate(filters);
  }

  /**
   * Gets the text content of the element.
   */
  public async getText(): Promise<string> {
    const host = await this.host();
    return (await host.text()).trim();
  }

  /**
   * Gets the inner HTML of the element.
   */
  public async getInnerHtml(): Promise<string> {
    const host = await this.host();
    return await host.getProperty<string>('innerHTML');
  }

  /**
   * Gets the value of a specific attribute on the element.
   * @param name The name of the attribute.
   */
  public async getAttribute(name: string): Promise<string | null> {
    const host = await this.host();
    return await host.getAttribute(name);
  }
}
