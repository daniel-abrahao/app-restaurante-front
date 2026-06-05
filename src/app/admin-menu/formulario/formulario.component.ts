import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, output, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuItem } from '../menu.service';

@Component({
  selector: 'menu-form',
  imports: [ReactiveFormsModule],
  templateUrl: './formulario.component.html',
  styleUrls: ['./formulario.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioComponent {
  readonly item = input<MenuItem | null>(null);
  readonly formSubmit = output<MenuItem>();

  private readonly fb = inject(FormBuilder);

  readonly categories = [
    { value: 'entrada', label: 'Entrada' },
    { value: 'prato_principal', label: 'Prato principal' },
    { value: 'sobremesa', label: 'Sobremesa' },
    { value: 'bebida', label: 'Bebida' },
  ];

  readonly form = this.fb.group({
    categoria: ['', Validators.required],
    nome: ['', Validators.required],
    ingredientes: ['', Validators.required],
    valor: [0, [Validators.required, Validators.min(0.01)]],
    imagemDataUrl: [null as string | null],
  });

  constructor() {
    effect(() => {
      const current = this.item();
      this.resetForm(current);
    });
  }

  readonly imageInput = viewChild<ElementRef<HTMLInputElement>>('imageInput');

  resetForCreate(): void {
    this.resetForm(null);
  }

  submitFromParent(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const item: MenuItem = {
      categoria: raw.categoria?.trim() ?? '',
      nome: raw.nome?.trim() ?? '',
      ingredientes: raw.ingredientes?.trim() ?? '',
      valor: Number(raw.valor) || 0,
      imagemDataUrl: raw.imagemDataUrl ?? null,
    };

    if (!item.categoria || !item.nome) {
      this.form.markAllAsTouched();
      return;
    }

    this.formSubmit.emit(item);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      this.form.controls.imagemDataUrl.setValue(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      this.form.controls.imagemDataUrl.setValue(result);
    };
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    this.form.controls.imagemDataUrl.setValue(null);
    this.clearFileInput();
  }

  private resetForm(item: MenuItem | null): void {
    if (item) {
      this.form.reset(
        {
          categoria: item.categoria ?? '',
          nome: item.nome ?? '',
          ingredientes: item.ingredientes ?? '',
          valor: item.valor ?? 0,
          imagemDataUrl: item.imagemDataUrl ?? null,
        },
        { emitEvent: false }
      );
      return;
    }

    this.form.reset(
      {
        categoria: '',
        nome: '',
        ingredientes: '',
        valor: 0,
        imagemDataUrl: null,
      },
      { emitEvent: false }
    );
    this.clearFileInput();
  }

  private clearFileInput(): void {
    const input = this.imageInput()?.nativeElement;
    if (input) input.value = '';
  }
}
