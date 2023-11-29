import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { InputService } from '../services/input.service';

export enum InputType {
  TEXT = 'text',
  NUMBER = 'number',
  EMAIL = 'email',
  SELECT = 'select',
  DATE = 'date',
  PASSWORD = 'password',
  TEXTAREA = 'textarea',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  HIDDEN = 'hidden',
  ARRAY = 'array',
  GROUP = 'group',
  FILE = 'file',
}

export type TypeRule = "required" | "email" | "min" | "max" | "minLength" | "maxLength" | "date";
export interface IRule {
  rule: TypeRule,
  value?: any
}

export interface IItem {
  label: string;
  value: any;
  name?: string;
}

export interface ISelectItem {
  label: string;
  value: any;
}

export interface IRemoteDataParam {
  key: string;
  value?: string;
}

export interface IRemoteData {
  url: string;
  fields: {
    value: string;
    label: string;
  };
  params?: IRemoteDataParam[];
}

export interface IChildrenParams {
  addButtonDisplay?: boolean,
  addButtonDisabled?: boolean,
  deleteButtonDisplay?: boolean,
  deleteButtonDisabled?: boolean,
}

export class ChildrenParams implements IChildrenParams {
  addButtonDisplay: boolean;
  addButtonDisabled: boolean;
  deleteButtonDisplay: boolean;
  deleteButtonDisabled: boolean;

  constructor() {
    this.addButtonDisplay = true;
    this.addButtonDisabled = false;
    this.deleteButtonDisplay = true;
    this.deleteButtonDisabled = false;
  }
}

export interface IControl {
  type: string | InputType,
  label: string,
  name: string,
  rules: IRule[],
  disabled?: boolean,
  value?: any,
  index: number,
  items?: IItem[],
  placeholder?: string,
  containerClass?: string,
  multiple?: boolean,
  patterns?: RegExp[] | string[],
  remote?: IRemoteData,
  childreen?: IControl[],
  childrenParams?: IChildrenParams,
  accept?: string
}

export interface Iform {
  id: number,
  controls: IControl[]
}

export const formSideParams = {
  dateNowValue: 'now',
  patterns: {
    onlyNumbers: /^-?(0|[1-9]\d*)?$/,
  }
}

@Component({
  selector: 'app-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss']
})
export class DynamicFormComponent implements OnInit {

  INPUT_TYPE = InputType;
  @Input() form!: Iform;
  @Input() formGroup!: FormGroup;
  @Input() containerClass!: string;

  constructor(public inputService: InputService) { }

  ngOnInit(): void {
  }

  getFormControl(formGroup: FormGroup, formName: string): AbstractControl {
    return formGroup.get(formName) as AbstractControl;
  }

  getFormGroup(formGroup: FormGroup, formName: string): FormGroup {
    return formGroup.get(formName) as FormGroup;
  }

}
