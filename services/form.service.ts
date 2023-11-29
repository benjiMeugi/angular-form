import { Injectable } from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from "@angular/forms";
import { forkJoin, Observable } from "rxjs";
import { forms } from "src/app/application/forms/forms";
import { HttpRequestService } from "../../http/http-request.service";
import { DateHelper, DateService } from "../../util/date";
import { _isDefined } from "../../util/type-utils";
import { formSideParams, IControl, Iform, IItem, InputType, IRemoteData } from "../dynamic-form/dynamic-form.component";
import { _response } from "src/app/application/response/response";

@Injectable({
    providedIn: 'root'
})
export class FormService {

    constructor(private fb: FormBuilder, private client: HttpRequestService,
        private dateService: DateService) { }

    /**
     * get form config
     * 
     * @param id 
     */
    async getForm(id: number): Promise<Iform|undefined> {
        let form = forms.find((v) => v.id === id);
        if (form && form.controls) { 
            form.controls = form.controls.sort((a, b) => a.index - b.index);
        }
        // form = await this.getRemoteData(form);

        return form;
    }

    /**
     * build formGroup
     * 
     * @param controlConfigs 
     */
    getFormGroup(controlConfigs: IControl[]): FormGroup {
        let group = this.fb.group({});
        if (controlConfigs.length > 0) {

            controlConfigs.forEach(controlConfig => {
                let value = _isDefined(controlConfig?.value) ? controlConfig.value : '';
                let disabled = controlConfig?.disabled ? controlConfig.disabled : false;
                let rules = this.getRules(controlConfig);


                if (controlConfig.type !== InputType.GROUP && controlConfig.type !== InputType.ARRAY) {
                    if (controlConfig.type === InputType.DATE) {
                        if (controlConfig.value === formSideParams.dateNowValue) {
                            value = this.dateService.now();
                        }
                    }

                    if (controlConfig.type === InputType.SELECT) {
                        value = controlConfig.value;
                    }

                    group.addControl(controlConfig.name, new FormControl({ value: value, disabled: disabled }, rules));
                } else {
                    if (controlConfig.type === InputType.GROUP && controlConfig.childreen) {
                        const subGroup = this.getFormGroup(controlConfig.childreen);
                        group.addControl(controlConfig.name, subGroup);
                        // group.addControl(controlConfig.name, new FormGroup({controlname: new FormControl('tva')}));
                    }

                    if (controlConfig.type === InputType.ARRAY && controlConfig.childreen) {
                        const formArray = this.fb.array([]);
                        const formArrayGoup = this.fb.group({});
                        controlConfig.childreen.forEach((child) => {
                            if (child.type === InputType.ARRAY && child.childreen) {
                                formArrayGoup.addControl(child.name, this.getFormGroup(child.childreen));
                            } else {
                                const disabled = child?.disabled ? child.disabled : false;
                                formArrayGoup.addControl(child.name, new FormControl({ value: child.value, disabled: disabled }, this.getRules(child)));
                            }
                        })

                        const minRule = controlConfig?.rules.find(rule => rule.rule === 'min');
                        const minRuleValue: number = minRule != undefined ? minRule.value : 1;
                        for (let i = 1; i <= minRuleValue; i++) {
                            formArray.push(formArrayGoup as unknown as  FormControl);
                        }

                        group.addControl(controlConfig.name, formArray);
                    }
                }

            });
            // console.log(group)
            // return group;
        }
        return group;
        // return null;
    }

    /**
     * set data in an formGroup using data keys.
     * 
     * not considering formArray
     * @param formGroup 
     * @param data 
     */
    setFormGroupData(formGroup: FormGroup, data: any) {
        Object.keys(data).forEach((key: any, i: number) => {
            if (_isDefined(data?.[key])) {
                let value = data[key];
                if (formGroup.get(key) instanceof FormArray) {
                    // FormArray
                } else if (formGroup.get(key) instanceof FormGroup) {
                    this.setFormGroupData(formGroup.get(key) as FormGroup, value);
                } else {
                    if (!(value instanceof Array)) {
                        if (this.dateService.isDate(value)) {
                            value = this.dateService.parseToFr(value);
                        }
                    }
                    formGroup.controls?.[key]?.setValue(value);
                }
            }
        })

        // not taking date format well...
        // formGroup.patchValue(data);
    }

    getFormGroupWithData(controlConfig: IControl, data: any): FormGroup {
        let group = this.fb.group({});
        if (controlConfig.type === InputType.ARRAY && controlConfig.childreen) {
            controlConfig.childreen.forEach((child) => {
                if (_isDefined(child.value))
                    if (_isDefined(child.value.value))
                        child.value.value = data[child.name];
                    else
                        child.value = data[child.name];
                const rules = this.getRules(child, group);
                group.addControl(child.name, new FormControl(child.value, rules));
            });
        }
        return group;
    }

    /**
     * get Validators
     * @param controlConfig
     * @returns
     */
    private getRules(controlConfig: IControl, formGroup?: FormGroup): ValidatorFn[] {
        let rules: ValidatorFn[] = [];
        if (controlConfig?.rules && controlConfig.rules.length > 0) {
            controlConfig.rules.forEach((r) => {
                let value = r.value;
                if (r.value && formGroup?.contains(r.value)) {
                    value = formGroup?.controls[(r.value)].value;
                }

                if (r.rule === 'required') {
                    rules.push(Validators.required);
                }
                if (r.rule === 'min') {
                    rules.push(Validators.min(value));
                }
                if (r.rule === 'max') {
                    rules.push(Validators.max(value));
                }
                if (r.rule === 'minLength') {
                    rules.push(Validators.minLength(value));
                }
                if (r.rule === 'maxLength') {
                    rules.push(Validators.maxLength(value));
                }
                if (r.rule === 'email') {
                    rules.push(Validators.email);
                }
            })
        }
        if (controlConfig?.patterns && controlConfig.patterns.length > 0) {
            controlConfig.patterns.forEach((p: string | RegExp) => {
                rules.push(Validators.pattern(p));
                // console.log(Validators.pattern(p), p);
            })
        }
        // console.log(rules)
        return rules;
    }

    private async getRemoteData(form: Iform): Promise<Iform> {
        let _form = form;
        let requests: Observable<any>[] = [];
        let controls: IControl[] = [];
        form.controls.forEach((control) => {
            if (control.remote) {
                if (control.type === InputType.SELECT) {
                    controls.push(control);
                    requests.push(this.client.get(control.remote.url));
                }
            }

            /* added by Joël, for children that you forget ☻ */
            control.childreen?.forEach((children_control) => {
                if (children_control.remote) {
                    if (children_control.type === InputType.SELECT) {
                        controls.push(children_control);
                        requests.push(this.client.get(children_control.remote.url));
                    }
                }
            })
        })

        let dataFromRequests = await forkJoin(requests).toPromise();
        if (dataFromRequests) {
            dataFromRequests.forEach((data, index) => {
                form.controls.map((control) => {
                    if (control.remote && control.type === InputType.SELECT) {
                        if (control.name == controls[index].name) {
                            control.items = this.getRemoteItems(data, control)
                        }
                    }

                    /* added by Joël, for children that you forget ☻ */
                    control.childreen?.forEach((control) => {
                        if (control.remote && control.type === InputType.SELECT) {
                            if (control.name == controls[index].name) {
                                control.items = this.getRemoteItems(data, control)
                            }
                        }
                    })
                })
            })
        }
        return _form;
    }

    /**
     * build items array
     * 
     * @param data 
     * @param control 
     * @returns 
     */
    private getRemoteItems(data: any, control: IControl): IItem[] {
        let _data = _response.getResponseData(data);
        let items: IItem[] = [];
        _data.forEach((element: any[]) => {
            if (control.remote && control.remote.fields) {
                let item: IItem = {
                    value: element[control.remote.fields.value as any],
                    label: element[control.remote.fields.label as any],
                }
                items.push(item);
            }
        });
        return items;
    }

    /**
     * return an IControl
     * @param id 
     * @param controlName 
     * @returns IControl
     */
    // public getControlConfig(id: number, controlName: string) {
    //     let form = forms.find((v) => v.id === id);
    //     return form.controls.find((v) => v.name === controlName);
    // }

    getIControl(iControls: IControl[], key: string, value?: any): IControl|undefined {
        return iControls.find((v) => v.name === key);
        // return iControls?.find(x => (value ? x[key] == value : x[key]) ??
        //     this.getIControl(x.childreen, key, value));
    }
}