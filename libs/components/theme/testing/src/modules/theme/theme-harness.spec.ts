import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  SkyTheme,
  SkyThemeMode,
  SkyThemeModule,
  SkyThemeSettings,
  SkyThemeSpacing,
} from '@skyux/theme';

import { SkyThemeHarness } from './theme-harness';

@Component({
  selector: 'sky-theme-test',
  template: `<div data-sky-id="test-theme" [skyTheme]="themeSettings">
    <p>Themed content</p>
  </div>`,
  standalone: false,
})
class TestComponent {
  public themeSettings: SkyThemeSettings | undefined;
}

describe('Theme harness', () => {
  async function setupTest(options: { dataSkyId?: string } = {}): Promise<{
    harness: SkyThemeHarness;
    fixture: ComponentFixture<TestComponent>;
    loader: HarnessLoader;
  }> {
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [SkyThemeModule],
    }).compileComponents();

    const fixture = TestBed.createComponent(TestComponent);
    const loader = TestbedHarnessEnvironment.loader(fixture);

    let harness: SkyThemeHarness;

    if (options.dataSkyId) {
      harness = await loader.getHarness(
        SkyThemeHarness.with({
          dataSkyId: options.dataSkyId,
        }),
      );
    } else {
      harness = await loader.getHarness(SkyThemeHarness);
    }

    return { harness, fixture, loader };
  }

  it('should return the default theme name when no theme is set', async () => {
    const { harness, fixture } = await setupTest({
      dataSkyId: 'test-theme',
    });

    fixture.detectChanges();

    await expectAsync(harness.getThemeName()).toBeResolvedTo('default');
  });

  it('should return the default theme name when default theme is set', async () => {
    const { harness, fixture } = await setupTest({
      dataSkyId: 'test-theme',
    });

    fixture.componentInstance.themeSettings = new SkyThemeSettings(
      SkyTheme.presets.default,
      SkyThemeMode.presets.light,
    );
    fixture.detectChanges();

    await expectAsync(harness.getThemeName()).toBeResolvedTo('default');
  });

  it('should return the modern theme name when modern theme is set', async () => {
    const { harness, fixture } = await setupTest({
      dataSkyId: 'test-theme',
    });

    fixture.componentInstance.themeSettings = new SkyThemeSettings(
      SkyTheme.presets.modern,
      SkyThemeMode.presets.light,
    );
    fixture.detectChanges();

    await expectAsync(harness.getThemeName()).toBeResolvedTo('modern');
  });

  it('should return the light theme mode by default', async () => {
    const { harness, fixture } = await setupTest({
      dataSkyId: 'test-theme',
    });

    fixture.detectChanges();

    await expectAsync(harness.getThemeMode()).toBeResolvedTo('light');
  });

  it('should return the light theme mode when light mode is set', async () => {
    const { harness, fixture } = await setupTest({
      dataSkyId: 'test-theme',
    });

    fixture.componentInstance.themeSettings = new SkyThemeSettings(
      SkyTheme.presets.modern,
      SkyThemeMode.presets.light,
    );
    fixture.detectChanges();

    await expectAsync(harness.getThemeMode()).toBeResolvedTo('light');
  });

  it('should return the dark theme mode when dark mode is set', async () => {
    const { harness, fixture } = await setupTest({
      dataSkyId: 'test-theme',
    });

    fixture.componentInstance.themeSettings = new SkyThemeSettings(
      SkyTheme.presets.modern,
      SkyThemeMode.presets.dark,
    );
    fixture.detectChanges();

    await expectAsync(harness.getThemeMode()).toBeResolvedTo('dark');
  });

  it('should return the standard theme spacing by default', async () => {
    const { harness, fixture } = await setupTest({
      dataSkyId: 'test-theme',
    });

    fixture.detectChanges();

    await expectAsync(harness.getThemeSpacing()).toBeResolvedTo('standard');
  });

  it('should return the compact theme spacing when compact spacing is set', async () => {
    const { harness, fixture } = await setupTest({
      dataSkyId: 'test-theme',
    });

    fixture.componentInstance.themeSettings = new SkyThemeSettings(
      SkyTheme.presets.modern,
      SkyThemeMode.presets.light,
      SkyThemeSpacing.presets.compact,
    );
    fixture.detectChanges();

    await expectAsync(harness.getThemeSpacing()).toBeResolvedTo('compact');
  });

  it('should return true for isModernTheme when modern theme is set', async () => {
    const { harness, fixture } = await setupTest({
      dataSkyId: 'test-theme',
    });

    fixture.componentInstance.themeSettings = new SkyThemeSettings(
      SkyTheme.presets.modern,
      SkyThemeMode.presets.light,
    );
    fixture.detectChanges();

    await expectAsync(harness.isModernTheme()).toBeResolvedTo(true);
    await expectAsync(harness.isDefaultTheme()).toBeResolvedTo(false);
  });

  it('should return true for isDefaultTheme when default theme is set', async () => {
    const { harness, fixture } = await setupTest({
      dataSkyId: 'test-theme',
    });

    fixture.componentInstance.themeSettings = new SkyThemeSettings(
      SkyTheme.presets.default,
      SkyThemeMode.presets.light,
    );
    fixture.detectChanges();

    await expectAsync(harness.isDefaultTheme()).toBeResolvedTo(true);
    await expectAsync(harness.isModernTheme()).toBeResolvedTo(false);
  });

  it('should return true for isDarkMode when dark mode is set', async () => {
    const { harness, fixture } = await setupTest({
      dataSkyId: 'test-theme',
    });

    fixture.componentInstance.themeSettings = new SkyThemeSettings(
      SkyTheme.presets.modern,
      SkyThemeMode.presets.dark,
    );
    fixture.detectChanges();

    await expectAsync(harness.isDarkMode()).toBeResolvedTo(true);
    await expectAsync(harness.isLightMode()).toBeResolvedTo(false);
  });

  it('should return true for isLightMode when light mode is set', async () => {
    const { harness, fixture } = await setupTest({
      dataSkyId: 'test-theme',
    });

    fixture.componentInstance.themeSettings = new SkyThemeSettings(
      SkyTheme.presets.modern,
      SkyThemeMode.presets.light,
    );
    fixture.detectChanges();

    await expectAsync(harness.isLightMode()).toBeResolvedTo(true);
    await expectAsync(harness.isDarkMode()).toBeResolvedTo(false);
  });

  it('should find harness without dataSkyId filter', async () => {
    const { harness, fixture } = await setupTest();

    fixture.detectChanges();

    await expectAsync(harness.getThemeName()).toBeResolvedTo('default');
  });
});
