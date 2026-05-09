import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NgFor, DecimalPipe, NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import { MenuService, MenuItem } from '../menu.service';

@Component({
  selector: 'app-lista-menu',
  templateUrl: './lista-menu.component.html',
  imports: [NgFor, NgIf, DecimalPipe],
  styleUrls: ['./lista-menu.component.scss']
})
export class ListaMenuComponent implements OnInit, OnDestroy {
  menuService = inject(MenuService);
  items: MenuItem[] = [];
  private sub: Subscription | null = null;
  categories = ['entrada', 'prato_principal', 'sobremesa', 'bebida'];
  activeTab: string = this.categories[0];

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

  itemsByCategory(cat: string): MenuItem[] {
    return this.items.filter(i => i.categoria === cat);
  }

  setTab(cat: string): void {
    this.activeTab = cat;
  }

  removeItem(item: MenuItem): void {
    const idx = this.items.indexOf(item);
    if (idx >= 0) this.menuService.remove(idx);
  }

  getGlobalIndex(category: string, item: MenuItem): number {
    // find index in global items array matching the reference
    return this.items.findIndex(i => i === item);
  }
}
