import { Component, Input } from '@angular/core';
import { AbstractControl, FormControl } from '@angular/forms';
import { IControl } from '../../dynamic-form/dynamic-form.component';
import { InputService } from '../../services/input.service';

@Component({
  selector: 'app-file-input',
  templateUrl: './file-input.component.html',
  styleUrls: ['./file-input.component.scss']
})
export class FileInputComponent {

  @Input() control!: AbstractControl;
  @Input() controlConfig!: IControl;

  files: File[] = [];
  get _control() {
    return this.control as FormControl
  }

  get _accept(): string {
    return this.controlConfig?.accept ?? '*';
  }

  constructor(public inputService: InputService) { }


  onSelect(event: any) {
    this._control.markAsTouched();
    if (this.controlConfig.multiple && this.controlConfig.multiple === true) {
      this.files.push(...event.addedFiles);
    } else {
      this.files = [];
      this.files.push(...event.addedFiles);
    }
    this.setFilesDataURL();
  }

  onRemove(event: File) {
    this.files.splice(this.files.indexOf(event), 1);
    this.setFilesDataURL();
  }

  setFilesDataURL() {
    let controlData: any[] = [];
    let promises: Promise<any>[] = [];
    this.files.forEach( (file) => {
      promises.push(this.readFile(file));
    })

    Promise.all(promises).then((promisesData) => {
      promisesData.forEach((promiseData, index) => {
        const data = {
          name: this.files[index].name,
          type: this.files[index].type,
          size: this.files[index].size,
          dataURL: promiseData,
        };
        controlData.push(data);
      })
      if (this.controlConfig.multiple && this.controlConfig.multiple === true) {
        this._control.setValue(controlData);
      } else {
        this._control.setValue(controlData?.[0]);
      }
    })
    
  }

  private async readFile(file: File): Promise<string | ArrayBuffer | null> {
    return new Promise<string | ArrayBuffer | null>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = e => {
        let res = e && e.target ? e.target.result : null;
        return resolve(res);
      };

      reader.onerror = e => {
        console.error(`FileReader failed on file ${file.name}.`);
        return reject(e);
      };

      if (!file) {
        console.error('No file to read.');
        return reject(null);
      }

      reader.readAsDataURL(file);
    });
  }


}
