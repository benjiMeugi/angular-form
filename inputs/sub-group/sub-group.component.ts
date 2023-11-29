import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { IControl, Iform, InputType } from '../../dynamic-form/dynamic-form.component';

@Component({
  selector: 'app-sub-group',
  templateUrl: './sub-group.component.html',
  styleUrls: ['./sub-group.component.scss']
})
export class SubGroupComponent implements OnInit {
  INPUT_TYPE = InputType;

  @Input() control!: FormGroup;
  @Input() controlConfig!: IControl;

  get form(): Iform {
    return {
      id: 0,
      controls: this.controlConfig && this.controlConfig.childreen ? this.controlConfig.childreen : []
    }
  }

  constructor() { }


  ngOnInit(): void {
  }

}
