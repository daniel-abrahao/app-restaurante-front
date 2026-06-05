import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { catchError, map, of } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Cliente {
  id?: number;
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
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl.replace(/\/$/, '');
  private readonly itemsSubject = new BehaviorSubject<Cliente[]>([]);
  readonly items$ = this.itemsSubject.asObservable();

  constructor() {
    this.refresh();
  }

  private endpoint(path = ''): string {
    return `${this.apiUrl}/clientes${path}`;
  }

  private refresh(): void {
    this.http
      .get<unknown>(this.endpoint(), { params: this.listParams() })
      .pipe(
        map(response => this.normalizeCollection(response)),
        catchError(() => of(this.getAll()))
      )
      .subscribe(items => this.itemsSubject.next(items));
  }

  private normalizeItem(raw: unknown, fallback: Cliente | null): Cliente | null {
    if (!raw || typeof raw !== 'object') return fallback;
    const record = raw as Record<string, unknown>;
    const legacyEndereco = this.readString(record['endereco']);
    const rua = this.readString(record['rua']) || legacyEndereco || fallback?.rua || '';

    return {
      id: this.readNumber(record['id']) ?? fallback?.id,
      nome: this.readString(record['nome']) || fallback?.nome || '',
      telefone: this.readString(record['telefone']) || fallback?.telefone || '',
      rua,
      numero: this.readString(record['numero']) || fallback?.numero || '',
      complemento: this.readNullableString(record['complemento']) ?? fallback?.complemento ?? null,
      bairro: this.readString(record['bairro']) || fallback?.bairro || '',
      referencia: this.readNullableString(record['referencia']) ?? fallback?.referencia ?? null,
      email: this.readNullableString(record['email']) ?? fallback?.email ?? null,
      observacoes: this.readNullableString(record['observacoes']) ?? fallback?.observacoes ?? null,
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

  getAll(): Cliente[] {
    return this.itemsSubject.getValue();
  }

  add(item: Cliente): void {
    this.http
      .post<unknown>(this.endpoint(), item)
      .pipe(
        map(response => this.normalizeItem(response, item)),
        catchError(() => of<Cliente | null>(null))
      )
      .subscribe(saved => {
        if (!saved) return;
        this.itemsSubject.next([...this.getAll(), saved]);
      });
  }

  update(index: number, item: Cliente): void {
    const current = this.getAll()[index];
    if (!current) return;

    if (current.id == null) {
      const items = this.getAll().slice();
      items[index] = item;
      this.itemsSubject.next(items);
      return;
    }

    this.http
      .put<unknown>(this.endpoint(`/${current.id}`), item)
      .pipe(
        map(response => this.normalizeItem(response, { ...item, id: current.id })),
        catchError(() => of<Cliente | null>(null))
      )
      .subscribe(updated => {
        if (!updated) return;
        const items = this.getAll().slice();
        items[index] = updated;
        this.itemsSubject.next(items);
      });
  }

  remove(index: number): void {
    const current = this.getAll()[index];
    if (!current) return;

    if (current.id == null) {
      const items = this.getAll().slice();
      items.splice(index, 1);
      this.itemsSubject.next(items);
      return;
    }

    this.http
      .delete<unknown>(this.endpoint(`/${current.id}`))
      .pipe(catchError(() => of(false)))
      .subscribe(success => {
        if (!success) return;
        const items = this.getAll().slice();
        items.splice(index, 1);
        this.itemsSubject.next(items);
      });
  }

  private listParams(): HttpParams {
    return new HttpParams()
      .set('order', 'asc')
      .set('page', '0')
      .set('pageSize', '1000')
      .set('sort', 'nome');
  }

  private normalizeCollection(response: unknown): Cliente[] {
    if (Array.isArray(response)) {
      return response
        .map(item => this.normalizeItem(item, null))
        .filter((item): item is Cliente => item !== null);
    }

    if (response && typeof response === 'object') {
      const record = response as Record<string, unknown>;
      const candidates = [record['content'], record['items'], record['data']];
      for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
          return candidate
            .map(item => this.normalizeItem(item, null))
            .filter((item): item is Cliente => item !== null);
        }
      }
    }

    return [];
  }

  private readNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }
}
