import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { expect } from '@skyux-sdk/testing';
import { SkyListModule } from '@skyux/list-builder';

import { SkyListHarness } from './list-harness';

//#region Test Component
@Component({
  selector: 'sky-list-test',
  template: `
    <sky-list [data]="data"></sky-list>
    <sky-list data-sky-id="other-list" [data]="otherData"></sky-list>
  `,
  standalone: false,
})
class TestComponent {
  public data = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
  ];

  public otherData = [{ id: '3', name: 'Item 3' }];
}
//#endregion Test Component

describe('List harness', () => {
  async function setupTest(options: { dataSkyId?: string } = {}): Promise<{
    listHarness: SkyListHarness;
    fixture: ComponentFixture<TestComponent>;
    loader: HarnessLoader;
  }> {
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [SkyListModule],
    }).compileComponents();

    const fixture = TestBed.createComponent(TestComponent);
    const loader = TestbedHarnessEnvironment.loader(fixture);

    let listHarness: SkyListHarness;

    if (options.dataSkyId) {
      listHarness = await loader.getHarness(
        SkyListHarness.with({
          dataSkyId: options.dataSkyId,
        }),
      );
    } else {
      listHarness = await loader.getHarness(SkyListHarness);
    }

    fixture.detectChanges();

    return { listHarness, fixture, loader };
  }

  it('should get the list from its data-sky-id', async () => {
    const { listHarness } = await setupTest({
      dataSkyId: 'other-list',
    });
    const id = await listHarness.getId();
    expect(id).toBeTruthy();
  });

  it('should get the list id', async () => {
    const { listHarness } = await setupTest();
    const id = await listHarness.getId();
    expect(id).toContain('sky-list-cmp-');
  });
});
