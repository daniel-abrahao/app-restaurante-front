import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Garcon {
  nome: string;
  documento: string;
  fotoDataUrl?: string | null;
  folgas: string[];
}

@Injectable({ providedIn: 'root' })
export class GarconService {
  private readonly storageKey = 'garcons';
  private readonly itemsSubject = new BehaviorSubject<Garcon[]>(this.loadFromStorage());
  readonly items$ = this.itemsSubject.asObservable();

  private loadFromStorage(): Garcon[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as Garcon[]) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: Garcon[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }

  getAll(): Garcon[] {
    return this.itemsSubject.getValue();
  }

  add(item: Garcon): void {
    const items = [...this.getAll(), item];
    this.itemsSubject.next(items);
    this.saveToStorage(items);
  }

  update(index: number, item: Garcon): void {
    const items = this.getAll().slice();
    if (index >= 0 && index < items.length) {
      items[index] = item;
      this.itemsSubject.next(items);
      this.saveToStorage(items);
    }
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
