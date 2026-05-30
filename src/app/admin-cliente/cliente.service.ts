import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Cliente {
  nome: string;
  telefone: string;
  rua: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  referencia?: string | null;
  email?: string | null;
  observacoes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly storageKey = 'clientes';
  private readonly itemsSubject = new BehaviorSubject<Cliente[]>(this.loadFromStorage());
  readonly items$ = this.itemsSubject.asObservable();

  private loadFromStorage(): Cliente[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map(item => this.normalizeItem(item))
        .filter((item): item is Cliente => item !== null);
    } catch {
      return [];
    }
  }

  private normalizeItem(raw: unknown): Cliente | null {
    if (!raw || typeof raw !== 'object') return null;
    const record = raw as Record<string, unknown>;
    const legacyEndereco = this.readString(record['endereco']);
    const rua = this.readString(record['rua']) || legacyEndereco;

    return {
      nome: this.readString(record['nome']),
      telefone: this.readString(record['telefone']),
      rua,
      numero: this.readString(record['numero']),
      complemento: this.readNullableString(record['complemento']),
      bairro: this.readString(record['bairro']),
      referencia: this.readNullableString(record['referencia']),
      email: this.readNullableString(record['email']),
      observacoes: this.readNullableString(record['observacoes']),
    };
  }

  private readString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    return '';
  }

  private readNullableString(value: unknown): string | null {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    return null;
  }

  private saveToStorage(items: Cliente[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }

  getAll(): Cliente[] {
    return this.itemsSubject.getValue();
  }

  add(item: Cliente): void {
    const items = [...this.getAll(), item];
    this.itemsSubject.next(items);
    this.saveToStorage(items);
  }

  update(index: number, item: Cliente): void {
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
