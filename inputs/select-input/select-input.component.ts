import { Component, Inject, Input, OnInit } from '@angular/core';
import { AbstractControl, FormControl } from '@angular/forms';
import { IControl } from '../../dynamic-form/dynamic-form.component';
import { InputService } from '../../services/input.service';
import { HttpRequestService } from 'src/app/core/http/http-request.service';
import { Subject, takeUntil } from 'rxjs';
import { FORM_CONFIG, IFormConfig } from '../../contracts/contracts';

@Component({
  selector: 'app-select-input',
  templateUrl: './select-input.component.html',
  styleUrls: ['./select-input.component.scss']
})
export class SelectInputComponent implements OnInit {
  @Input() control!: AbstractControl;
  @Input() controlConfig!: IControl;

  _destroy$ = new Subject();
  loading = false;
  selectedValue: any;
  data: any[] = [];

  get _control() {
    return this.control as FormControl
  }
  constructor(public inputService: InputService, private client: HttpRequestService, @Inject(FORM_CONFIG) private formConfig: IFormConfig) { }

  ngOnInit(): void {
    if (this.controlConfig.items && this.controlConfig.items.length > 0) {
      this.data = this.controlConfig.items;
    } else {
      this.fetchData();
    }
  }

  fetchData() {
    this.loading = true;
    if (this.controlConfig.remote && this.controlConfig.remote.url) {
      this.client.get(this.controlConfig.remote.url)
        .pipe(takeUntil(this._destroy$))
        .subscribe((result) => {
          const resultDatas: any[] = this.formConfig.responseHandler(result) as unknown as any[];
          let newData: any[] = [];
          resultDatas.forEach((resultData) => {
            if (this.controlConfig.remote) {
              const item = {
                value: resultData?.[this.controlConfig.remote.fields.value],
                label: resultData?.[this.controlConfig.remote.fields.label],
              }
              newData.push(item);
            }
          })
          this.data = newData;
          // console.log(this.data);
          this.loading = false;
        })
    }
  }

  public compareFn(a: any, b: any): boolean {
    return a.value == (b.id ?? b);
  }

  multipleCompareFn(user1: any, user2: any) {
    return user1 && user2 ? user1.id === user2.id : user1 === user2;
  }
}
