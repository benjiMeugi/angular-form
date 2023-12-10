import { InjectionToken } from "@angular/core";

export const FORM_CONFIG = new InjectionToken<IFormConfig>(
    "Injection de token Form"
);

export interface IFormConfig {

    responseHandler: (response: any) => { response: any; };
}