import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MenuService, MenuItem } from '../menu.service';

@Component({
  selector: 'menu-form',
  imports: [RouterLink],
  templateUrl: './formulario.component.html',
  styleUrls: ['./formulario.component.scss'],
})
export class FormularioComponent implements OnInit, OnDestroy {
  private menuService = inject(MenuService);
  private sub: Subscription | null = null;
  editingIndex: number | null = null;

  @ViewChild('menuForm') menuFormRef!: ElementRef<HTMLFormElement>;

  ngOnInit(): void {
    this.sub = this.menuService.editing$.subscribe(state => {
      if (state && state.index !== null && state.item) {
        this.editingIndex = state.index;
        // populate form when view is ready
        setTimeout(() => this.populateForm(state.item));
      } else {
        this.editingIndex = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  populateForm(item: MenuItem): void {
    const form = this.menuFormRef?.nativeElement;
    if (!form) return;
    (form.elements.namedItem('categoria') as HTMLSelectElement).value = item.categoria || '';
    (form.elements.namedItem('nome') as HTMLInputElement).value = item.nome || '';
    (form.elements.namedItem('ingredientes') as HTMLTextAreaElement).value = item.ingredientes || '';
    (form.elements.namedItem('valor') as HTMLInputElement).value = String(item.valor ?? '');
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    const form = this.menuFormRef.nativeElement;
    const fd = new FormData(form);

    const item: MenuItem = {
      categoria: String(fd.get('categoria') || '').trim(),
      nome: String(fd.get('nome') || '').trim(),
      ingredientes: String(fd.get('ingredientes') || '').trim(),
      valor: parseFloat(String(fd.get('valor') || '0')) || 0,
    };

    if (!item.categoria || !item.nome) {
      return;
    }

    if (this.editingIndex !== null) {
      this.menuService.update(this.editingIndex, item);
      this.menuService.clearEdit();
    } else {
      this.menuService.add(item);
    }

    form.reset();
    this.editingIndex = null;
  }

  onReset(formRef: HTMLFormElement | any): void {
    if (formRef && formRef.reset) formRef.reset();
    this.menuService.clearEdit();
    this.editingIndex = null;
  }

  cancelEdit(): void {
    this.menuService.clearEdit();
    this.menuFormRef.nativeElement.reset();
    this.editingIndex = null;
  }
}
