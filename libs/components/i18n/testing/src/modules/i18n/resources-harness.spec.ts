import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkyI18nModule, SkyLibResourcesService } from '@skyux/i18n';

import { SkyResourcesHarness } from './resources-harness';

@Component({
  selector: 'sky-resources-test',
  template: `
    <span data-sky-id="test-resources" skyLibResources>{{ resourceText }}</span>
    <span
      data-sky-id="test-resources-with-attr"
      skyLibResources
      [title]="titleText"
      >{{ resourceText }}</span
    >
  `,
  standalone: false,
})
class TestComponent {
  public resourceText = 'Hello World';
  public titleText = 'Test Title';
}

describe('Resources harness', () => {
  async function setupTest(options: { dataSkyId?: string } = {}): Promise<{
    harness: SkyResourcesHarness;
    fixture: ComponentFixture<TestComponent>;
    loader: HarnessLoader;
  }> {
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [SkyI18nModule],
      providers: [SkyLibResourcesService],
    }).compileComponents();

    const fixture = TestBed.createComponent(TestComponent);
    const loader = TestbedHarnessEnvironment.loader(fixture);

    let harness: SkyResourcesHarness;

    if (options.dataSkyId) {
      harness = await loader.getHarness(
        SkyResourcesHarness.with({
          dataSkyId: options.dataSkyId,
        }),
      );
    } else {
      harness = await loader.getHarness(SkyResourcesHarness);
    }

    return { harness, fixture, loader };
  }

  it('should get the text content of the element', async () => {
    const { harness, fixture } = await setupTest({
      dataSkyId: 'test-resources',
    });

    fixture.detectChanges();

    await expectAsync(harness.getText()).toBeResolvedTo('Hello World');
  });

  it('should get updated text content when resource text changes', async () => {
    const { harness, fixture } = await setupTest({
      dataSkyId: 'test-resources',
    });

    fixture.detectChanges();

    await expectAsync(harness.getText()).toBeResolvedTo('Hello World');

    fixture.componentInstance.resourceText = 'Updated Text';
    fixture.detectChanges();

    await expectAsync(harness.getText()).toBeResolvedTo('Updated Text');
  });

  it('should get the inner HTML of the element', async () => {
    const { harness, fixture } = await setupTest({
      dataSkyId: 'test-resources',
    });

    fixture.detectChanges();

    const innerHTML = await harness.getInnerHtml();
    expect(innerHTML).toContain('Hello World');
  });

  it('should get an attribute value from the element', async () => {
    const { harness, fixture } = await setupTest({
      dataSkyId: 'test-resources-with-attr',
    });

    fixture.detectChanges();

    await expectAsync(harness.getAttribute('title')).toBeResolvedTo(
      'Test Title',
    );
  });

  it('should return null for non-existent attribute', async () => {
    const { harness, fixture } = await setupTest({
      dataSkyId: 'test-resources',
    });

    fixture.detectChanges();

    await expectAsync(harness.getAttribute('non-existent-attr')).toBeResolvedTo(
      null,
    );
  });

  it('should find harness without dataSkyId filter', async () => {
    const { harness, fixture } = await setupTest();

    fixture.detectChanges();

    await expectAsync(harness.getText()).toBeResolvedTo('Hello World');
  });

  it('should get all harnesses matching the selector', async () => {
    const { loader, fixture } = await setupTest();

    fixture.detectChanges();

    const harnesses = await loader.getAllHarnesses(SkyResourcesHarness);

    expect(harnesses.length).toBe(2);
  });
});
