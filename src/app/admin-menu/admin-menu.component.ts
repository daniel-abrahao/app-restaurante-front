import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormularioComponent } from './formulario/formulario.component';
import { ListaMenuComponent } from './lista/lista-menu.component';

@Component({
  selector: 'app-admin-menu',
  imports: [RouterLink, FormularioComponent, ListaMenuComponent],
  templateUrl: './admin-menu.component.html',
  styleUrl: './admin-menu.component.scss',
})
export class AdminMenuComponent {}
