import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import type { PaginatorState } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { GarconService, Garcon } from './garcon.service';

type FolgasState = {
  seg: boolean;
  ter: boolean;
  qua: boolean;
  qui: boolean;
  sex: boolean;
  sab: boolean;
  dom: boolean;
};

@Component({
  selector: 'app-admin-garcon',
  imports: [
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ConfirmDialogModule,
    PaginatorModule,
    ToggleButtonModule,
  ],
  templateUrl: './admin-garcon.component.html',
  styleUrl: './admin-garcon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService],
})
export class AdminGarconComponent {
  private readonly service = inject(GarconService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly items = toSignal(this.service.items$, { initialValue: this.service.getAll() });
  readonly totalRecords = toSignal(this.service.totalRecords$, {
    initialValue: this.service.getTotalRecords(),
  });
  readonly currentPage = toSignal(this.service.currentPage$, {
    initialValue: this.service.getCurrentPage(),
  });
  readonly pageSize = this.service.pageSize;
  readonly sortedItems = computed(() =>
    [...this.items()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
  );
  readonly dialogVisible = signal(false);
  readonly activeIndex = signal<number | null>(null);
  readonly dialogTitle = computed(() =>
    this.activeIndex() === null ? 'Novo garcon' : 'Editar garcon'
  );

  readonly weekdays = [
    { key: 'seg', label: 'Seg', full: 'Segunda' },
    { key: 'ter', label: 'Ter', full: 'Terca' },
    { key: 'qua', label: 'Qua', full: 'Quarta' },
    { key: 'qui', label: 'Qui', full: 'Quinta' },
    { key: 'sex', label: 'Sex', full: 'Sexta' },
    { key: 'sab', label: 'Sab', full: 'Sabado' },
    { key: 'dom', label: 'Dom', full: 'Domingo' },
  ] as const;

  readonly folgasGroup = this.fb.group<FolgasState>({
    seg: false,
    ter: false,
    qua: false,
    qui: false,
    sex: false,
    sab: false,
    dom: false,
  });

  readonly form = this.fb.group({
    nome: ['', Validators.required],
    documento: ['', Validators.required],
    fotoDataUrl: new FormControl<string | null>(null),
    folgas: this.folgasGroup,
  });

  readonly imageInput = viewChild<ElementRef<HTMLInputElement>>('imageInput');

  openCreate(): void {
    this.activeIndex.set(null);
    this.resetForm(null);
    this.dialogVisible.set(true);
  }

  openEdit(item: Garcon): void {
    const index = this.items().indexOf(item);
    if (index < 0) return;
    this.activeIndex.set(index);
    this.resetForm(item);
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.activeIndex.set(null);
  }

  submitForm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const item: Garcon = {
      nome: raw.nome.trim(),
      documento: raw.documento.trim(),
      fotoBase64: raw.fotoDataUrl ?? null,
      folgas: this.getSelectedFolgas(raw.folgas),
    };

    if (!item.nome || !item.documento) {
      this.form.markAllAsTouched();
      return;
    }

    const index = this.activeIndex();
    if (index === null) {
      this.service.add(item);
    } else {
      this.service.update(index, item);
    }

    this.closeDialog();
  }

  confirmDelete(item: Garcon): void {
    const index = this.items().indexOf(item);
    if (index < 0) return;
    this.confirmationService.confirm({
      message: `Deseja excluir o garcon "${item.nome}"?`,
      header: 'Confirmar exclusao',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      accept: () => this.service.remove(index),
    });
  }

  onPageChange(event: PaginatorState): void {
    this.service.loadPage(event.page ?? 0);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      this.form.controls.fotoDataUrl.setValue(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      this.form.controls.fotoDataUrl.setValue(result);
    };
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    this.form.controls.fotoDataUrl.setValue(null);
    this.clearFileInput();
  }

  formatFolgas(folgas: string[]): string {
    if (!folgas || folgas.length === 0) return 'Sem folgas';
    const map = this.weekdays.reduce<Record<string, string>>((acc, day) => {
      acc[day.key] = day.full;
      return acc;
    }, {});
    return folgas.map(key => map[key] ?? key).join(', ');
  }

  private getSelectedFolgas(state: FolgasState): string[] {
    return this.weekdays.filter(day => state[day.key]).map(day => day.key);
  }

  private resetForm(item: Garcon | null): void {
    if (item) {
      this.form.reset(
        {
          nome: item.nome ?? '',
          documento: item.documento ?? '',
          fotoDataUrl: item.fotoBase64 ?? null,
          folgas: this.toFolgasState(item.folgas),
        },
        { emitEvent: false }
      );
    } else {
      this.form.reset(
        {
          nome: '',
          documento: '',
          fotoDataUrl: null,
          folgas: this.toFolgasState([]),
        },
        { emitEvent: false }
      );
    }

    this.clearFileInput();
  }

  private toFolgasState(folgas: string[] | null | undefined): FolgasState {
    const set = new Set(folgas ?? []);
    return {
      seg: set.has('seg'),
      ter: set.has('ter'),
      qua: set.has('qua'),
      qui: set.has('qui'),
      sex: set.has('sex'),
      sab: set.has('sab'),
      dom: set.has('dom'),
    };
  }

  private clearFileInput(): void {
    const input = this.imageInput()?.nativeElement;
    if (input) input.value = '';
  }
}
