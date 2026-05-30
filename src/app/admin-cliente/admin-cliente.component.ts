import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ClienteService, Cliente } from './cliente.service';

@Component({
  selector: 'app-admin-cliente',
  imports: [
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ConfirmDialogModule,
  ],
  templateUrl: './admin-cliente.component.html',
  styleUrl: './admin-cliente.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService],
})
export class AdminClienteComponent {
  private readonly service = inject(ClienteService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly items = toSignal(this.service.items$, { initialValue: this.service.getAll() });
  readonly sortedItems = computed(() =>
    [...this.items()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
  );
  readonly dialogVisible = signal(false);
  readonly activeIndex = signal<number | null>(null);
  readonly dialogTitle = computed(() =>
    this.activeIndex() === null ? 'Novo cliente' : 'Editar cliente'
  );

  readonly form = this.fb.group({
    nome: ['', Validators.required],
    telefone: ['', Validators.required],
    rua: ['', Validators.required],
    numero: ['', Validators.required],
    complemento: [''],
    bairro: ['', Validators.required],
    referencia: [''],
    email: ['', Validators.email],
    observacoes: [''],
  });

  openCreate(): void {
    this.activeIndex.set(null);
    this.resetForm(null);
    this.dialogVisible.set(true);
  }

  openEdit(item: Cliente): void {
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
    const email = raw.email.trim();
    const observacoes = raw.observacoes.trim();
    const telefone = this.formatTelefone(raw.telefone);
    const complemento = raw.complemento.trim();
    const referencia = raw.referencia.trim();

    const item: Cliente = {
      nome: raw.nome.trim(),
      telefone,
      rua: raw.rua.trim(),
      numero: raw.numero.trim(),
      complemento: complemento ? complemento : null,
      bairro: raw.bairro.trim(),
      referencia: referencia ? referencia : null,
      email: email ? email : null,
      observacoes: observacoes ? observacoes : null,
    };

    if (!item.nome || !item.telefone || !item.rua || !item.numero || !item.bairro) {
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

  confirmDelete(item: Cliente): void {
    const index = this.items().indexOf(item);
    if (index < 0) return;
    this.confirmationService.confirm({
      message: `Deseja excluir o cliente "${item.nome}"?`,
      header: 'Confirmar exclusao',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      accept: () => this.service.remove(index),
    });
  }

  private resetForm(item: Cliente | null): void {
    if (item) {
      this.form.reset(
        {
          nome: item.nome ?? '',
          telefone: this.formatTelefone(item.telefone ?? ''),
          rua: item.rua ?? '',
          numero: item.numero ?? '',
          complemento: item.complemento ?? '',
          bairro: item.bairro ?? '',
          referencia: item.referencia ?? '',
          email: item.email ?? '',
          observacoes: item.observacoes ?? '',
        },
        { emitEvent: false }
      );
      return;
    }

    this.form.reset(
      {
        nome: '',
        telefone: '',
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        referencia: '',
        email: '',
        observacoes: '',
      },
      { emitEvent: false }
    );
  }

  formatEndereco(item: Cliente): string {
    const rua = item.rua?.trim();
    const numero = item.numero?.trim();
    const bairro = item.bairro?.trim();
    const complemento = item.complemento?.trim();

    const base = [rua, numero].filter(Boolean).join(', ');
    const withComplemento = complemento ? `${base} (${complemento})` : base;
    const parts = [withComplemento, bairro].filter(Boolean);
    return parts.length ? parts.join(' - ') : '-';
  }

  onTelefoneInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) return;
    const formatted = this.formatTelefone(input.value);
    input.value = formatted;
    this.form.controls.telefone.setValue(formatted, { emitEvent: false });
  }

  private formatTelefone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;

    const ddd = digits.slice(0, 2);
    const rest = digits.slice(2);
    if (!rest) return `(${ddd})`;

    const prefixLen = rest.length > 8 ? 5 : 4;
    const first = rest.slice(0, prefixLen);
    const second = rest.slice(prefixLen);
    if (!second) return `(${ddd}) ${first}`;
    return `(${ddd}) ${first}-${second}`;
  }
}
