import { HarnessPredicate } from '@angular/cdk/testing';
import { SkyComponentHarness } from '@skyux/core/testing';

import { SkyThemeHarnessFilters } from './theme-harness-filters';

/**
 * Harness for interacting with a theme directive in tests.
 */
export class SkyThemeHarness extends SkyComponentHarness {
  /**
   * @internal
   */
  public static hostSelector = '[skyTheme]';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a
   * `SkyThemeHarness` that meets certain criteria.
   */
  public static with(
    filters: SkyThemeHarnessFilters,
  ): HarnessPredicate<SkyThemeHarness> {
    return SkyThemeHarness.getDataSkyIdPredicate(filters);
  }

  /**
   * Gets the current theme name.
   * @returns The theme name ('default' or 'modern').
   */
  public async getThemeName(): Promise<string> {
    const host = await this.host();

    if (await host.hasClass('sky-theme-modern')) {
      return 'modern';
    }

    return 'default';
  }

  /**
   * Gets the current theme mode.
   * @returns The theme mode ('light' or 'dark').
   */
  public async getThemeMode(): Promise<string> {
    const host = await this.host();

    if (await host.hasClass('sky-theme-mode-dark')) {
      return 'dark';
    }

    return 'light';
  }

  /**
   * Gets the current theme spacing.
   * @returns The theme spacing ('standard' or 'compact').
   */
  public async getThemeSpacing(): Promise<string> {
    const host = await this.host();

    if (await host.hasClass('sky-theme-modern-compact')) {
      return 'compact';
    }

    return 'standard';
  }

  /**
   * Gets whether the theme is the modern theme.
   */
  public async isModernTheme(): Promise<boolean> {
    return (await this.getThemeName()) === 'modern';
  }

  /**
   * Gets whether the theme is the default theme.
   */
  public async isDefaultTheme(): Promise<boolean> {
    return (await this.getThemeName()) === 'default';
  }

  /**
   * Gets whether the theme mode is dark.
   */
  public async isDarkMode(): Promise<boolean> {
    return (await this.getThemeMode()) === 'dark';
  }

  /**
   * Gets whether the theme mode is light.
   */
  public async isLightMode(): Promise<boolean> {
    return (await this.getThemeMode()) === 'light';
  }
}
