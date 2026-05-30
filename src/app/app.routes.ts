import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AdminMenuComponent } from './admin-menu/admin-menu.component';
import { AdminGarconComponent } from './admin-garcon/admin-garcon.component';
import { AdminClienteComponent } from './admin-cliente/admin-cliente.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'menu',
    component: AdminMenuComponent
  },
  {
    path: 'garcons',
    component: AdminGarconComponent
  },
  {
    path: 'clientes',
    component: AdminClienteComponent
  }
];
