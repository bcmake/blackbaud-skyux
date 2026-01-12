import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { expect } from '@skyux-sdk/testing';
import { SkyTextEditorModule } from '@skyux/text-editor';

import { SkyTextEditorHarness } from './text-editor-harness';

//#region Test Component
@Component({
  selector: 'sky-text-editor-test',
  template: `
    <form [formGroup]="form">
      <sky-text-editor
        formControlName="content"
        labelText="Description"
        hintText="Enter a description"
      ></sky-text-editor>
      <sky-text-editor
        data-sky-id="other-editor"
        formControlName="otherContent"
        labelText="Other"
      ></sky-text-editor>
      <sky-text-editor
        data-sky-id="no-label-editor"
        formControlName="noLabelContent"
      ></sky-text-editor>
      <sky-text-editor
        data-sky-id="required-editor"
        formControlName="requiredContent"
        labelText="Required Field"
      ></sky-text-editor>
    </form>
  `,
  standalone: false,
})
class TestComponent {
  public form = new FormGroup({
    content: new FormControl(''),
    otherContent: new FormControl(''),
    noLabelContent: new FormControl(''),
    requiredContent: new FormControl('', Validators.required),
  });
}
//#endregion Test Component

describe('Text editor harness', () => {
  async function setupTest(options: { dataSkyId?: string } = {}): Promise<{
    textEditorHarness: SkyTextEditorHarness;
    fixture: ComponentFixture<TestComponent>;
    loader: HarnessLoader;
  }> {
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [SkyTextEditorModule, ReactiveFormsModule],
    }).compileComponents();

    const fixture = TestBed.createComponent(TestComponent);
    const loader = TestbedHarnessEnvironment.loader(fixture);

    let textEditorHarness: SkyTextEditorHarness;

    if (options.dataSkyId) {
      textEditorHarness = await loader.getHarness(
        SkyTextEditorHarness.with({
          dataSkyId: options.dataSkyId,
        }),
      );
    } else {
      textEditorHarness = await loader.getHarness(SkyTextEditorHarness);
    }

    fixture.detectChanges();

    return { textEditorHarness, fixture, loader };
  }

  it('should get the text editor from its data-sky-id', async () => {
    const { textEditorHarness } = await setupTest({
      dataSkyId: 'other-editor',
    });
    const labelText = await textEditorHarness.getLabelText();
    expect(labelText).toBe('Other');
  });

  it('should get the label text', async () => {
    const { textEditorHarness } = await setupTest();
    const labelText = await textEditorHarness.getLabelText();
    expect(labelText).toBe('Description');
  });

  it('should return undefined when no label is present', async () => {
    const { textEditorHarness } = await setupTest({
      dataSkyId: 'no-label-editor',
    });
    const labelText = await textEditorHarness.getLabelText();
    expect(labelText).toBeUndefined();
  });

  it('should get the hint text', async () => {
    const { textEditorHarness } = await setupTest();
    const hintText = await textEditorHarness.getHintText();
    expect(hintText).toBe('Enter a description');
  });

  it('should return undefined when no hint text is present', async () => {
    const { textEditorHarness } = await setupTest({
      dataSkyId: 'other-editor',
    });
    const hintText = await textEditorHarness.getHintText();
    expect(hintText).toBeUndefined();
  });

  it('should check if the text editor is disabled', async () => {
    const { textEditorHarness, fixture } = await setupTest();
    expect(await textEditorHarness.isDisabled()).toBe(false);

    fixture.componentInstance.form.get('content')?.disable();
    fixture.detectChanges();

    expect(await textEditorHarness.isDisabled()).toBe(true);
  });

  it('should check if the text editor has errors', async () => {
    const { textEditorHarness } = await setupTest({
      dataSkyId: 'required-editor',
    });
    expect(await textEditorHarness.hasErrors()).toBe(false);
  });

  it('should check if the text editor is focused', async () => {
    const { textEditorHarness } = await setupTest();
    expect(await textEditorHarness.isFocused()).toBe(false);
  });

  it('should check if the label is marked as required', async () => {
    const { textEditorHarness } = await setupTest({
      dataSkyId: 'required-editor',
    });
    expect(await textEditorHarness.isRequired()).toBe(true);
  });

  it('should return false for isRequired when no label is present', async () => {
    const { textEditorHarness } = await setupTest({
      dataSkyId: 'no-label-editor',
    });
    expect(await textEditorHarness.isRequired()).toBe(false);
  });
});
