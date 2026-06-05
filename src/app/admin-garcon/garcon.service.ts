import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { catchError, map, of } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

import { environment } from '../../environments/environment';

export interface Garcon {
  id?: number;
  nome: string;
  documento: string;
  fotoDataUrl?: string | null;
  folgas: string[];
}

@Injectable({ providedIn: 'root' })
export class GarconService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl.replace(/\/$/, '');
  private readonly itemsSubject = new BehaviorSubject<Garcon[]>([]);
  private readonly totalRecordsSubject = new BehaviorSubject<number>(0);
  private readonly currentPageSubject = new BehaviorSubject<number>(0);
  private currentPage = 0;
  readonly items$ = this.itemsSubject.asObservable();
  readonly totalRecords$ = this.totalRecordsSubject.asObservable();
  readonly currentPage$ = this.currentPageSubject.asObservable();
  readonly pageSize = 10;

  constructor() {
    this.refresh();
  }

  private endpoint(path = ''): string {
    return `${this.apiUrl}/garcom${path}`;
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

  getAll(): Garcon[] {
    return this.itemsSubject.getValue();
  }

  add(item: Garcon): void {
    this.http
      .post<unknown>(this.endpoint(), item)
      .pipe(
        map(response => this.normalizeItem(response, item)),
        catchError(() => of<Garcon | null>(null))
      )
      .subscribe(saved => {
        if (!saved) return;
        this.refresh();
      });
  }

  update(index: number, item: Garcon): void {
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
        catchError(() => of<Garcon | null>(null))
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
      .set('pageSize', String(this.pageSize))
      .set('sort', 'nome');
  }

  private normalizeCollectionResponse(
    response: unknown,
    headers: HttpHeaders
  ): { items: Garcon[]; totalRecords: number; currentPage: number } {
    const totalRecords = this.readNumber(headers.get('X-Paging-Total-Count'));
    const currentPage = this.readNumber(headers.get('X-Paging-Current-Page'));

    if (Array.isArray(response)) {
      const items = response
        .map(item => this.normalizeItem(item, null))
        .filter((item): item is Garcon => item !== null);
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
            .filter((item): item is Garcon => item !== null);
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

  private normalizeItem(raw: unknown, fallback: Garcon | null): Garcon | null {
    if (!raw || typeof raw !== 'object') {
      return fallback;
    }

    const record = raw as Record<string, unknown>;
    return {
      id: this.readNumber(record['id']) ?? fallback?.id,
      nome: this.readString(record['nome']) || fallback?.nome || '',
      documento: this.readString(record['documento']) || fallback?.documento || '',
      fotoDataUrl: this.readNullableString(record['fotoDataUrl']) ?? fallback?.fotoDataUrl ?? null,
      folgas: this.readStringArray(record['folgas']) ?? fallback?.folgas ?? [],
    };
  }

  private readString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private readNullableString(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }

  private readStringArray(value: unknown): string[] | null {
    if (!Array.isArray(value)) return null;
    return value.filter((item): item is string => typeof item === 'string');
  }

  private readNumber(value: unknown): number | null {
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }
}
