import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import { MenuService, MenuItem } from '../menu.service';

@Component({
  selector: 'app-lista-menu',
  templateUrl: './lista-menu.component.html',
  imports: [NgFor, NgIf],
  styleUrls: ['./lista-menu.component.scss']
})
export class ListaMenuComponent implements OnInit, OnDestroy {
  private menuService = inject(MenuService);
  items: MenuItem[] = [];
  private sub: Subscription | null = null;

  ngOnInit(): void {
    this.items = this.menuService.getAll();
    this.sub = this.menuService.items$.subscribe(list => this.items = list);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  remove(index: number): void {
    this.menuService.remove(index);
  }

  formatCategoria(key: string): string {
    switch (key) {
      case 'entrada': return 'Entrada';
      case 'prato_principal': return 'Prato principal';
      case 'sobremesa': return 'Sobremesa';
      case 'bebida': return 'Bebida';
      default: return key || '-';
    }
  }
}
