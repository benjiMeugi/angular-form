import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { _isDefined } from 'src/app/core/util/type-utils';
import { ChildrenParams, IControl, Iform } from '../../dynamic-form/dynamic-form.component';
import { FormService } from '../../services/form.service';
import { InputService } from '../../services/input.service';

@Component({
  selector: 'app-repeatable-group',
  templateUrl: './repeatable-group.component.html',
  styleUrls: ['./repeatable-group.component.scss']
})
export class RepeatableGroupComponent implements OnInit {
  @Input() control!: AbstractControl;
  @Input() controlConfig!: IControl;

  get formArray() {
    return this.control as FormArray;
  }

  get form() {
    return { id: 0, controls: this.controlConfig.childreen } as Iform
  }

  get formGroup() {
    return this.formService.getFormGroup(this.controlConfig.childreen || []);
  }

  _destroy$ = new Subject();

  constructor(public inputService: InputService, private formService: FormService) { }

  ngOnInit(): void {
    if (!_isDefined(this.controlConfig?.childrenParams)) {
      this.controlConfig.childrenParams = new ChildrenParams;
    }
  }

  getFormGroup(control: AbstractControl) {
    return control as FormGroup;
  }

  /**
   * add a new row to formArray
   */
  add() {
    this.formArray.push(this.formGroup)
  }

  /**
   * remove a row
   * @param i 
   */
  remove(i: number) {
    this.formArray.removeAt(i);
  }


  getMinRows(): number {
    return this.controlConfig.rules.find((rule) => rule.rule == 'min')?.value ?? 1;
  }

  // getMaxRows(): number {
  //   return this.controlConfig.rules.find((rule) => rule.rule == 'max').value ?? null;
  // }

  ngOnDestroy(): void {
    this._destroy$.next('');
  }
}
