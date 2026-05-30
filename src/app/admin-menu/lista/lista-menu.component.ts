import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { MenuService, MenuItem } from '../menu.service';
import { FormularioComponent } from '../formulario/formulario.component';

@Component({
  selector: 'app-lista-menu',
  templateUrl: './lista-menu.component.html',
  imports: [
    DecimalPipe,
    TableModule,
    ButtonModule,
    DialogModule,
    ConfirmDialogModule,
    FormularioComponent,
  ],
  styleUrls: ['./lista-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService],
})
export class ListaMenuComponent {
  private readonly menuService = inject(MenuService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly items = toSignal(this.menuService.items$, { initialValue: this.menuService.getAll() });
  readonly dialogVisible = signal(false);
  readonly activeIndex = signal<number | null>(null);
  readonly dialogTitle = computed(() =>
    this.activeIndex() === null ? 'Novo item do menu' : 'Editar item do menu'
  );
  readonly activeItem = computed<MenuItem | null>(() => {
    const index = this.activeIndex();
    return index === null ? null : this.items()[index] ?? null;
  });

  readonly formComponent = viewChild(FormularioComponent);

  openCreate(): void {
    this.activeIndex.set(null);
    this.formComponent()?.resetForCreate();
    this.dialogVisible.set(true);
  }

  openEdit(index: number): void {
    this.activeIndex.set(index);
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.activeIndex.set(null);
  }

  submitForm(): void {
    this.formComponent()?.submitFromParent();
  }

  handleSave(item: MenuItem): void {
    const index = this.activeIndex();
    if (index === null) {
      this.menuService.add(item);
    } else {
      this.menuService.update(index, item);
    }
    this.closeDialog();
  }

  confirmDelete(index: number): void {
    const item = this.items()[index];
    if (!item) return;
    this.confirmationService.confirm({
      message: `Deseja excluir o item "${item.nome}"?`,
      header: 'Confirmar exclusao',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      accept: () => this.menuService.remove(index),
    });
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

}
