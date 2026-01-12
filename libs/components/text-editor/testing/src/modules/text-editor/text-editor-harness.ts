import { HarnessPredicate } from '@angular/cdk/testing';
import { SkyComponentHarness } from '@skyux/core/testing';

import { SkyTextEditorHarnessFilters } from './text-editor-harness-filters';

/**
 * Harness for interacting with a text editor component in tests.
 */
export class SkyTextEditorHarness extends SkyComponentHarness {
  /**
   * @internal
   */
  public static hostSelector = 'sky-text-editor';

  #getWrapper = this.locatorFor('.sky-text-editor');
  #getLabelElement = this.locatorForOptional('.sky-control-label');
  #getHintText = this.locatorForOptional('.sky-text-editor-hint-text');

  /**
   * Gets a `HarnessPredicate` that can be used to search for a
   * `SkyTextEditorHarness` that meets certain criteria.
   */
  public static with(
    filters: SkyTextEditorHarnessFilters,
  ): HarnessPredicate<SkyTextEditorHarness> {
    return SkyTextEditorHarness.getDataSkyIdPredicate(filters);
  }

  /**
   * Gets the label text for the text editor.
   */
  public async getLabelText(): Promise<string | undefined> {
    const label = await this.#getLabelElement();
    if (label) {
      return (await label.text()).trim();
    }
    return undefined;
  }

  /**
   * Gets the hint text for the text editor.
   */
  public async getHintText(): Promise<string | undefined> {
    const hintText = await this.#getHintText();
    if (hintText) {
      const text = (await hintText.text()).trim();
      return text || undefined;
    }
    return undefined;
  }

  /**
   * Checks if the text editor is disabled.
   */
  public async isDisabled(): Promise<boolean> {
    const wrapper = await this.#getWrapper();
    return await wrapper.hasClass('sky-text-editor-disabled');
  }

  /**
   * Checks if the text editor has validation errors.
   */
  public async hasErrors(): Promise<boolean> {
    const wrapper = await this.#getWrapper();
    return await wrapper.hasClass('sky-text-editor-invalid');
  }

  /**
   * Checks if the text editor is focused.
   */
  public async isFocused(): Promise<boolean> {
    const wrapper = await this.#getWrapper();
    return await wrapper.hasClass('sky-text-editor-wrapper-focused');
  }

  /**
   * Checks if the label is marked as required.
   */
  public async isRequired(): Promise<boolean> {
    const label = await this.#getLabelElement();
    if (label) {
      return await label.hasClass('sky-control-label-required');
    }
    return false;
  }
}
