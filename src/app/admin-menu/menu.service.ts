import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface MenuItem {
  categoria: string;
  nome: string;
  ingredientes: string;
  valor: number;
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly storageKey = 'menuItems';
  private itemsSubject = new BehaviorSubject<MenuItem[]>(this.loadFromStorage());
  readonly items$ = this.itemsSubject.asObservable();
  private editingSubject = new BehaviorSubject<{ index: number | null; item: MenuItem } | null>(null);
  readonly editing$ = this.editingSubject.asObservable();

  private loadFromStorage(): MenuItem[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as MenuItem[]) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: MenuItem[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }

  getAll(): MenuItem[] {
    return this.itemsSubject.getValue();
  }

  add(item: MenuItem): void {
    const items = [...this.getAll(), item];
    this.itemsSubject.next(items);
    this.saveToStorage(items);
  }

  update(index: number, item: MenuItem): void {
    const items = this.getAll().slice();
    if (index >= 0 && index < items.length) {
      items[index] = item;
      this.itemsSubject.next(items);
      this.saveToStorage(items);
    }
  }

  startEdit(index: number): void {
    const items = this.getAll();
    if (index >= 0 && index < items.length) {
      this.editingSubject.next({ index, item: items[index] });
    }
  }

  clearEdit(): void {
    this.editingSubject.next(null);
  }

  remove(index: number): void {
    const items = this.getAll().slice();
    if (index >= 0 && index < items.length) {
      items.splice(index, 1);
      this.itemsSubject.next(items);
      this.saveToStorage(items);
    }
  }

  clear(): void {
    this.itemsSubject.next([]);
    this.saveToStorage([]);
  }
}
