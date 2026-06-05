import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { catchError, map, of } from 'rxjs';

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
  readonly items$ = this.itemsSubject.asObservable();

  constructor() {
    this.refresh();
  }

  private endpoint(path = ''): string {
    return `${this.apiUrl}/garcom${path}`;
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
        this.itemsSubject.next([...this.getAll(), saved]);
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

  private listParams(): HttpParams {
    return new HttpParams()
      .set('order', 'asc')
      .set('page', '0')
      .set('pageSize', '1000')
      .set('sort', 'nome');
  }

  private normalizeCollection(response: unknown): Garcon[] {
    if (Array.isArray(response)) {
      return response
        .map(item => this.normalizeItem(item, null))
        .filter((item): item is Garcon => item !== null);
    }

    if (response && typeof response === 'object') {
      const record = response as Record<string, unknown>;
      const candidates = [record['content'], record['items'], record['data']];
      for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
          return candidate
            .map(item => this.normalizeItem(item, null))
            .filter((item): item is Garcon => item !== null);
        }
      }
    }

    return [];
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
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }
}
