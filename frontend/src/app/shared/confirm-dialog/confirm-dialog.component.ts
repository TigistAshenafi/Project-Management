import { Component, Inject } from '@angular/core';
import { ConfirmService } from '../confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent {
  constructor(@Inject(ConfirmService) public confirm: ConfirmService) {}
}


