# App Restaurante Front

Front-end do projeto desenvolvido para a disciplina de pós-graduação **Desenvolvimento Full Stack**.

Este repositório concentra a aplicação cliente do sistema, construída com **Angular v21** e **PrimeNG**, seguindo uma abordagem moderna para interfaces reativas, componentização e experiência do usuário.

## Sobre o projeto

O objetivo deste front-end é disponibilizar a interface visual do sistema de restaurante, consumindo as funcionalidades da aplicação e oferecendo uma base organizada para evolução durante a disciplina.

## Tecnologias utilizadas

- Node.js 22
- npm
- Angular v21
- PrimeNG
- TypeScript
- RxJS

## Pré-requisitos

Antes de iniciar, verifique se o ambiente está utilizando:

- **Node.js 22** ou superior
- `npm` compatível com o projeto

> Recomendação: use Node.js 22 para evitar incompatibilidades com dependências e com a versão atual do Angular.

## Instalação

Instale as dependências com:

```bash
npm install
```

## Comandos disponíveis

Use sempre os scripts do `package.json` com `npm run`.

### Desenvolvimento local

```bash
npm run start
```

O servidor de desenvolvimento será iniciado em `http://localhost:4200/`.

### Build de produção

```bash
npm run build
```

O resultado da compilação será gerado em `dist/`.

### Build em modo observação

```bash
npm run watch
```

Esse comando recompila a aplicação automaticamente durante o desenvolvimento.

### Testes

```bash
npm run test
```

## Estrutura do projeto

```text
src/
  app/
	app.config.ts
	app.routes.ts
	app.ts
	app.html
	app.scss
  main.ts
  styles.scss
```

## Observações importantes

- Este projeto é o **front-end** do trabalho da disciplina.
- A aplicação foi construída em cima do **Angular v21**.
- Os componentes visuais utilizam **PrimeNG** como base de UI.
- Se houver troca de versão do Node.js, valide novamente os comandos de instalação e build.

## Fluxo recomendado

1. Instalar dependências com `npm install`
2. Iniciar o ambiente com `npm run start`
3. Desenvolver e validar alterações localmente
4. Executar `npm run test`
5. Gerar a versão final com `npm run build`

## Licença

Projeto acadêmico desenvolvido para fins de estudo e avaliação na pós-graduação.
