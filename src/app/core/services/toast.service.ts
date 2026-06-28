import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private toastr: ToastrService) { }

  success(message: string, title: string = 'Éxito') {
    this.toastr.success(message, title);
  }

  error(message: string, title: string = 'Error') {
    this.toastr.error(message, title);
  }

  info(message: string, title: string = 'Información') {
    this.toastr.info(message, title);
  }

  warning(message: string, title: string = 'Atención') {
    this.toastr.warning(message, title);
  }
}
