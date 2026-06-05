import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { catchError, map, of } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

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
  private readonly totalRecordsSubject = new BehaviorSubject<number>(0);
  private readonly currentPageSubject = new BehaviorSubject<number>(0);
  private currentPage = 0;
  readonly items$ = this.itemsSubject.asObservable();
  readonly totalRecords$ = this.totalRecordsSubject.asObservable();
  readonly currentPage$ = this.currentPageSubject.asObservable();
  readonly pageSize = 20;

  constructor() {
    this.refresh();
  }

  private endpoint(path = ''): string {
    return `${this.apiUrl}/clientes${path}`;
  }

  refresh(page = this.currentPage): void {
    this.currentPage = page;
    this.http
      .get<unknown>(this.endpoint(), { params: this.listParams(page), observe: 'response' })
      .pipe(
        map(response => this.normalizeCollectionResponse(response.body, response.headers)),
        catchError(() =>
          of({
            items: this.getAll(),
            totalRecords: this.totalRecordsSubject.getValue(),
            currentPage: this.currentPageSubject.getValue(),
          })
        )
      )
      .subscribe(result => {
        this.totalRecordsSubject.next(result.totalRecords);
        this.currentPageSubject.next(result.currentPage);
        this.itemsSubject.next(result.items);
      });
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
        this.refresh();
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
      .subscribe({
        next: () => this.refresh(),
        error: () => {},
      });
  }

  loadPage(page: number): void {
    this.refresh(page);
  }

  getTotalRecords(): number {
    return this.totalRecordsSubject.getValue();
  }

  getCurrentPage(): number {
    return this.currentPageSubject.getValue();
  }

  private listParams(page: number): HttpParams {
    return new HttpParams()
      .set('order', 'asc')
      .set('page', String(page))
      .set('pageSize', '20')
      .set('sort', 'nome');
  }

  private normalizeCollectionResponse(
    response: unknown,
    headers: HttpHeaders
  ): { items: Cliente[]; totalRecords: number; currentPage: number } {
    const totalRecords = this.readNumber(headers.get('X-Paging-Total-Count'));
    const currentPage = this.readNumber(headers.get('X-Paging-Current-Page'));

    if (Array.isArray(response)) {
      const items = response
        .map(item => this.normalizeItem(item, null))
        .filter((item): item is Cliente => item !== null);
      return {
        items,
        totalRecords: totalRecords ?? items.length,
        currentPage: currentPage ?? this.currentPage,
      };
    }

    if (response && typeof response === 'object') {
      const record = response as Record<string, unknown>;
      const candidates = [record['content'], record['items'], record['data']];
      for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
          const items = candidate
            .map(item => this.normalizeItem(item, null))
            .filter((item): item is Cliente => item !== null);
          return {
            items,
            totalRecords: totalRecords ?? items.length,
            currentPage: currentPage ?? this.currentPage,
          };
        }
      }
    }

    return {
      items: [],
      totalRecords: totalRecords ?? 0,
      currentPage: currentPage ?? this.currentPage,
    };
  }

  private readNumber(value: unknown): number | null {
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }
}
