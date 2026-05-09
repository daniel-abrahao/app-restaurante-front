import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AdminMenuComponent } from './admin-menu/admin-menu.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'menu',
    component: AdminMenuComponent
  }
];
