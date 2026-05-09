import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenuService, MenuItem } from '../menu.service';

@Component({
  selector: 'menu-form',
  imports: [RouterLink],
  templateUrl: './formulario.component.html',
  styleUrl: './formulario.component.scss',
})
export class FormularioComponent {
  private menuService = inject(MenuService);

  onSubmit(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
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

    this.menuService.add(item);
    form.reset();
  }
}
