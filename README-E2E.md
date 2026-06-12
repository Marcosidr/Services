# E2E & mkcert — Instruções rápidas

Este documento descreve como preparar o ambiente local para executar os testes End-to-End (Playwright) e como configurar HTTPS local com mkcert para `zentry.local`.

Pré-requisitos
- Node.js (versão LTS)
- Docker + Docker Compose (para rodar o backend/postgres/nginx localmente)
- mkcert (opcional, para HTTPS local)

1) Instalar dependências (raiz do repositório)

```powershell
cd C:\Workspace\Projeto6Modulo\Services\Services_frontend
npm install
npm i -D @playwright/test
npx playwright install --with-deps
```

2) Gerar certificados locais (mkcert)

```powershell
# instale mkcert conforme OS
mkcert -install
mkcert zentry.local localhost 127.0.0.1 ::1
# crie a pasta certs/ na raiz do projeto e mova os arquivos gerados
mkdir ..\certs
move zentry.local+2.pem ..\certs\zentry.local.pem
move zentry.local+2-key.pem ..\certs\zentry.local-key.pem
```

3) Hosts

Edite `C:\Windows\System32\drivers\etc\hosts` (PowerShell/Bloco de notas em modo admin) e adicione:

```
127.0.0.1 zentry.local
```

4) Variáveis de ambiente

- Copie `Services_backend/.env.example` para `Services_backend/.env` e preencha valores locais (não commitar).
- No root, existem variáveis usadas pelo `docker-compose.yml` (ex: `POSTGRES_PASSWORD`, `DATABASE_URL`). Configure-as em seu `.env` local ou exporte no ambiente.

5) Subir containers

```powershell
cd C:\Workspace\Projeto6Modulo\Services
docke compose up -d --build
```

6) Rodar E2E localmente

- Os testes E2E foram adicionados em `Services_frontend/tests/e2e/` e usam por padrão `https://zentry.local`.
- Para executar os testes:

```powershell
cd Services_frontend
# se necessário, ajuste BASE_URL
$env:BASE_URL = 'https://zentry.local'
npx playwright test
```

7) Hooks e CI

- Existe `.husky/pre-push` que roda `npm --prefix Services_frontend run e2e` antes do push.
- A workflow do GitHub Actions foi atualizada para construir o frontend e rodar os testes (arquivo: `Services_frontend/.github/workflows/playwright.yml`).

Problemas comuns
- Se os testes não encontrarem o servidor, verifique se o nginx está rodando e que o host `zentry.local` resolve para `127.0.0.1`.
- Se os navegadores Playwright não estiverem instalados, rode `npx playwright install --with-deps`.

Observação de segurança
- Nunca commit `Services_backend/.env` com credenciais reais. Use `Services_backend/.env.example` como template.

---
Arquivo criado automaticamente pelo avaliador.
