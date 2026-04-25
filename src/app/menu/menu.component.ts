import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgFor } from '@angular/common';

interface Dish { name: string; description: string; price: string }

@Component({
  selector: 'menu-page',
  imports: [RouterLink, NgFor],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent {
  protected readonly dishes: Dish[] = [
    { name: 'Bife à cavalo', description: 'Bife suculento com ovo e batatas.', price: 'R$ 28,00' },
    { name: 'Frango com quiabo', description: 'Receita tradicional da casa.', price: 'R$ 24,00' },
    { name: 'Feijoada', description: 'Porção completa para 1 pessoa.', price: 'R$ 30,00' }
  ];
}
