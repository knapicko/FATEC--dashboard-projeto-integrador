# Conserta Já - Dashboard Administrativo


<p align="center">
  <a href="https://react.dev/" target="_blank">
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  </a>
  <a href="https://vitejs.dev/" target="_blank">
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  </a>
  <a href="https://www.typescriptlang.org/" target="_blank">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  </a>
  <a href="https://supabase.com/" target="_blank">
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  </a>
  <a href="https://developer.mozilla.org/docs/Web/CSS" target="_blank">
    <img src="https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css&logoColor=white" alt="CSS">
  </a>
</p>

<p align="center">
  <img src="assets/logo-blue.png" alt="Conserta Já" width="180">
</p>

> Este repositório reúne o **site de apresentação (landing page)** e o **Dashboard Administrativo** da Conserta Já em um único projeto Vite.
>
> O **Dashboard Administrativo da Conserta Já** centraliza a gestão da plataforma mobile, permitindo acompanhar solicitações, usuários, profissionais, serviços, transações e conteúdos publicados.

O painel utiliza autenticação do Supabase e mantém o controle de acesso protegido por RLS. Somente contas cadastradas em `admin_users` podem acessar as funções administrativas.

---

## Funcionalidades

### Gestão operacional

* Gerenciar profissionais e verificar perfis
* Gerenciar clientes e consultar dados cadastrais
* Consultar CPF/CNPJ, contatos e pessoa física ou jurídica
* Visualizar documentos e certificados profissionais
* Acompanhar solicitações e atualizar seus status
* Gerenciar serviços oferecidos pelos profissionais
* Visualizar transações e pagamentos
* Consultar usuários recentemente ativos

### Conteúdo e moderação

* Gerenciar ofícios e funções
* Criar, editar, arquivar e excluir postagens
* Gerenciar mídias associadas às postagens
* Preparar notificações gerais
* Consultar falhas registradas em notificações

### Interface

* Layout responsivo para desktop e dispositivos móveis
* Navegação lateral adaptada ao tamanho da tela
* Modo claro e modo escuro persistente
* Fotos de perfil nas listagens de usuários e solicitações
* Modal com detalhes completos do cliente ou profissional
* Seletor visual de cores com HEX, RGB, HSL e CMYK

---

## Site + Dashboard integrados

| Rota | Arquivo | Conteúdo |
| --- | --- | --- |
| `/` | `index.html` + `landing/auth.js` | Landing page com todas as funcionalidades do app e login |
| `/dashboard/` | `dashboard/index.html` → `main.tsx` → `App.tsx` | Dashboard administrativo (sem alterações) |

**Como o login funciona**

* O botão **Entrar** no canto superior direito do site abre o login (e-mail e senha do Supabase Auth).
* Depois do login, o site confere se a conta está em `public.admin_users`, com a mesma regra do dashboard. Conta não autorizada recebe uma mensagem e a sessão é encerrada.
* Com a conta autorizada, aparece o botão de **painel** à esquerda do avatar, que leva para `/dashboard/`.
* Site e dashboard usam o mesmo `.env.local` e o mesmo domínio, então compartilham a sessão: quem entra pelo site chega ao dashboard já logado, e sair em um lado também sai no outro.

**Comandos**

```bash
npm install
npm run dev      # http://localhost:5173 (site) e http://localhost:5173/dashboard/
npm run build    # gera dist/index.html e dist/dashboard/index.html
npm run preview  # testa o build localmente
```

---

## Publicar no GitHub Pages

O projeto já vem com o workflow `.github/workflows/deploy.yml`, que faz o build e publica a cada push na `main`.

1. Suba o projeto para um repositório no GitHub (branch `main`).
2. No repositório: **Settings › Pages › Build and deployment › Source: GitHub Actions**.
3. Faça um push (ou rode o workflow em **Actions › Deploy GitHub Pages › Run workflow**).

O site fica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/` e o dashboard em `https://SEU-USUARIO.github.io/NOME-DO-REPO/dashboard/`.
O `.env.local` não vai para o GitHub; o workflow já usa a URL e a chave pública do Supabase do ConsertaJá.

---

## Administradores do painel

A página **Administração › Administradores** (menu lateral) permite:

* **Nova conta admin** — cria a conta no Supabase Auth (já confirmada) e adiciona em `admin_users`. Se o e-mail já existir no Auth, a conta só recebe o acesso (a senha atual é mantida).
* **Contas existentes** — lista todas as contas do Auth com uma chave (switch) para ligar/desligar o acesso ao painel. Não é possível remover o próprio acesso nem o último administrador.

Criar usuários no Auth exige a chave `service_role`, que nunca pode ir para o navegador. Por isso a tela usa a Edge Function `supabase/functions/admin-contas`, que confere se quem chama é administrador antes de qualquer ação. Publique-a uma vez:

```bash
npx supabase login
npx supabase functions deploy admin-contas --project-ref woqhicdlnkoksypipyoz
```

## Ofícios e funções (exclusão)

Antes, a exclusão podia "parecer" funcionar e o item voltava ao atualizar: sem política RLS de `DELETE`, o Supabase não retorna erro, apenas não apaga nenhuma linha. Agora o painel:

* confere se a linha foi realmente excluída/atualizada e mostra o motivo quando não foi;
* avisa quando o item está em uso (por exemplo, profissionais vinculados a uma função) em vez de falhar em silêncio;
* ao excluir um ofício, exclui também as funções dele (tudo ou nada).

Para liberar as operações, execute **uma vez** o arquivo `supabase/dashboard_admin_gestao.sql` no SQL Editor do Supabase. Ele cria as funções `admin_delete_oficio()` / `admin_delete_funcao()` e as políticas RLS de administrador para `oficios` e `funcoes`, sem desativar o RLS nem apagar dados.

O dashboard também tem **Voltar ao site** no menu lateral, um botão **Site** no topo e um link nas telas de login.

---

## Tecnologias utilizadas

* **React 18** - Interface e gerenciamento de estado
* **Vite** - Servidor de desenvolvimento e build
* **TypeScript** - Tipagem dos dados e componentes
* **CSS** - Tema claro, tema escuro e responsividade
* **Supabase** - Autenticação, banco de dados e RLS
* **Supabase Auth** - Login administrativo
* **Supabase Realtime Schema** - Estrutura relacional da plataforma

---

## Como executar o projeto

### Requisitos

* Node.js 20.19+ ou 22.12+ (exigido pelo Vite 8)
* npm
* Projeto configurado no Supabase

### 1. Clonar o repositório

```bash
git clone https://github.com/knapicko/FATEC--dashboard-projeto-integrador.git
cd FATEC--dashboard-projeto-integrador
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Configurar o Supabase

> O arquivo `.env.local` já acompanha o projeto apontando para o Supabase do app ConsertaJá. Só é preciso editá-lo para usar outro projeto.

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

No arquivo `.env.local`, informe a URL do projeto e a chave pública anon:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_SUPABASE_ANON_KEY
```

As variáveis podem ser obtidas em:

**Supabase Dashboard → Project Settings → API**

Não utilize a chave `service_role` no projeto do dashboard. Ela deve permanecer exclusiva no servidor.

### 4. Configurar o acesso administrativo

1. Crie uma conta em **Supabase Authentication → Users**.
2. Informe o mesmo e-mail no bloco administrativo do arquivo `supabase/admin_access.sql`.
3. Execute o script completo no **Supabase SQL Editor**.

O script cria:

* A tabela `admin_users`
* A função `is_dashboard_admin()`
* Políticas RLS administrativas
* Permissões de leitura e atualização necessárias ao painel
* A função segura `admin_delete_post()` para excluir postagens e mídias relacionadas

A RLS não deve ser desativada. Apenas a conta cadastrada em `admin_users` recebe acesso administrativo.

### 5. Iniciar o dashboard

```bash
npm start
```

Acesse:

```text
http://localhost:5173
```

### 6. Gerar o build de produção

```bash
npm run build
```

Os arquivos gerados ficam em:

```text
dist/
```

---

## Estrutura do projeto

```text
FATEC--dashboard-projeto-integrador/
├── assets/
│   ├── landing/          # telas do app usadas no site
│   ├── logo-blue.png
│   └── logo-white.png
├── dashboard/
│   └── index.html        # entrada do dashboard (/dashboard/)
├── landing/
│   └── auth.js           # login do site (Supabase + admin_users)
├── supabase/
│   ├── admin_access.sql
│   ├── dashboard_admin_gestao.sql   # exclusão de ofícios/funções + RLS de admin
│   ├── config.toml
│   └── functions/admin-contas/      # Edge Function da tela Administradores
├── src/
├── App.tsx
├── Dashboard.css
├── index.html            # landing page (/)
├── main.tsx
├── package.json
├── package-lock.json
├── vite.config.mjs       # build multipágina (site + dashboard)
├── .env.example
└── README.md
```

### Arquivos principais

* `App.tsx` - Autenticação, consultas, operações administrativas e componentes
* `Dashboard.css` - Layout responsivo, tema claro e tema escuro
* `supabase/admin_access.sql` - Configuração de administradores e políticas RLS
* `.env.example` - Modelo das variáveis do Supabase
* `assets/logo-white.png` - Logo utilizada no modo escuro e login
* `assets/logo-blue.png` - Logo utilizada em versões claras e favicon

---

## Segurança

* A chave anon é destinada ao uso no navegador
* Não colocar senha ou chave `service_role` no frontend
* Dados pessoais são exibidos somente para usuários autenticados e administrativos
* `admin_users` determina quais contas podem administrar o painel
* Políticas RLS permanecem ativadas nas tabelas consultadas
* Operações sensíveis devem continuar protegidas por políticas do Supabase

---

## Nossa equipe

O projeto foi desenvolvido por uma equipe multidisciplinar:

* **Flávio Henrique** - Product Owner
* **Gabriel Santos** - Desenvolvedor Back-end
* **Gustavo Almeida** - Desenvolvedor Full-Stack e Designer
* **Leandro Oliveira** - Designer e Analista
* **Lucas Eiji** - Scrum Master e Analista
* **Luiz Knapick** - Analista e Desenvolvedor Full-Stack

---

## Projetos relacionados

* **[Aplicativo Conserta Já](https://github.com/knapicko/FATEC--projeto-integrador)** - Aplicação mobile desenvolvida em Flutter

---

## Licença

Este projeto foi desenvolvido como parte do **Projeto Integrador da FATEC Ipiranga**.
