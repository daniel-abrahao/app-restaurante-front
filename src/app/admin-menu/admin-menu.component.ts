import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ListaMenuComponent } from './lista/lista-menu.component';

@Component({
  selector: 'app-admin-menu',
  imports: [ListaMenuComponent],
  templateUrl: './admin-menu.component.html',
  styleUrl: './admin-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMenuComponent {}
