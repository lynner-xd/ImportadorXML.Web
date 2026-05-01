# ImportadorXML — Frontend Web

Interface web do sistema contábil para importação e processamento de XMLs fiscais brasileiros (NFe, NFCe, NFSe).

## Stack

- **Angular 20** com standalone components e lazy loading
- **PrimeNG 21** + PrimeIcons para componentes de UI
- **TypeScript** com strict mode

## Pré-requisitos

- Node.js 20+
- Angular CLI: `npm install -g @angular/cli`
- Backend rodando em `http://localhost:5159` (ver repositório `ImportadorXML`)

## Rodar localmente

```bash
npm install --legacy-peer-deps
ng serve
```

Acesse `http://localhost:4200`.

> `--legacy-peer-deps` é necessário pela incompatibilidade de peer deps entre Angular 20 e PrimeNG 21.

## Build para produção

```bash
ng build --configuration production
```

Os arquivos gerados ficam em `dist/`.

## Estrutura de páginas

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/login` | Público | Autenticação |
| `/home` | Autenticado | Dashboard |
| `/importacao` | Empresa | Upload de XMLs fiscais |
| `/lancamentos` | Empresa | Gestão de lançamentos contábeis |
| `/plano-contas` | Empresa | Plano de contas em árvore |
| `/relatorios/balancete` | Empresa | Relatório balancete |
| `/relatorios/analitico` | Empresa | Relatório analítico |
| `/relatorios/sintetico` | Empresa | Relatório sintético |
| `/alterar-senha` | Autenticado | Alteração de senha |
| `/admin/usuarios` | Contador | Gerenciar usuários/empresas |
| `/admin/email` | Contador | Configuração de e-mail |
| `/admin/relatorios/*` | Contador | Relatórios de todas as empresas |

## Roles e acesso

- **Contador** (admin) — acesso total, gerencia empresas e visualiza relatórios de todas
- **Empresa** — acesso restrito aos próprios dados

## Variáveis de ambiente

| Arquivo | Uso | API URL |
|---------|-----|---------|
| `src/environments/environment.ts` | Desenvolvimento | `http://localhost:5159/api` |
| `src/environments/environment.prod.ts` | Produção | `/api` (relativa, via Nginx) |

## Primeiro acesso do admin

Ao fazer login pela primeira vez com a conta admin, o sistema redireciona automaticamente para `/alterar-senha`. O acesso ao sistema só é liberado após a troca de senha.

## Deploy

O deploy é feito via `deploy.sh` na raiz do monorepo. Consulte o README raiz para instruções.
