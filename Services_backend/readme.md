# Backend - Zentry (Node.js + Express + Sequelize + Postgres)

## 1. O que precisa baixar

1. Node.js 20+ (recomendado LTS)
2. npm 10+
3. Docker Desktop (recomendado para banco de teste local)
4. Git
5. VS Code (opcional)

## 2. Extensoes recomendadas (VS Code)

1. `ESLint` (dbaeumer.vscode-eslint)
2. `Prettier - Code formatter` (esbenp.prettier-vscode)
3. `Docker` (ms-azuretools.vscode-docker)
4. `SQLTools` (mtxr.sqltools)
5. `SQLTools PostgreSQL/Cockroach Driver` (mtxr.sqltools-driver-pg)
6. `EditorConfig for VS Code` (EditorConfig.EditorConfig)

## 3. Instalar dependencias

```bash
cd backend
npm install
```

## 4. Configurar ambiente (`.env`)

Crie `backend/.env` com os dados do banco principal (normalmente cloud):

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://usuario:senha@host:5432/nome_do_banco
JWT_SECRET=sua_chave_jwt
JWT_EXPIRES_IN=1d
DB_SSL=true
DB_SYNC_ALTER=false
```

Notas:

1. `DB_SSL=true` para bancos cloud.
2. Se usar Postgres local (`localhost`), use `DB_SSL=false`.
3. `DB_SYNC_ALTER` so use `true` quando souber exatamente o impacto.
4. Schema novo deve ser aplicado por migration (`db:migrate`), sem autoajuste no bootstrap.

## 5. Rodar backend em desenvolvimento

```bash
npm run db:migrate
npm run dev
```

Health check:

```txt
GET http://localhost:3000/api/health
```

## 6. Banco de teste local (Docker)

### 6.1 Subir container Postgres de teste

```bash
docker run --name zentry-test-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=zentry_test -p 5433:5432 -d postgres:16
```

Se o container ja existir:

```bash
docker start zentry-test-pg
```

Verificar:

```bash
docker ps
```

### 6.2 Configurar `backend/.env.test`

```env
JWT_SECRET=test_secret_local
JWT_EXPIRES_IN=1d
DATABASE_URL=postgres://postgres:postgres@localhost:5433/zentry_test
DB_SSL=false
```

### 6.3 Rodar migrations no banco de teste

```bash
npm run db:migrate:test
```

## 7. Scripts uteis

```bash
npm run dev
npm run dev:test
npm run build
npm run start
npm run db:migrate
npm run db:migrate:test
npm run db:migrate:undo
npm run db:migrate:status
npm run test
npm run test:watch
npm run test:coverage
```

### O que cada um faz

1. `dev`: usa `.env` (ambiente principal).
2. `dev:test`: usa `.env.test` (ambiente local de teste).
3. `db:migrate*`: aplica/consulta migrations versionadas.
4. `test*`: roda Jest com `.env.test` (testes em `backend/test`).

## 8. Rodar aplicacao em container

Na raiz do repositorio:

```bash
copy .env.example .env
docker compose up --build nginx
```

No Compose, apenas o Nginx fica exposto para o host. O backend fica restrito a
rede Docker e e acessado pelo Nginx em `/api`.

Validacao pelo proxy:

```txt
GET https://zentry.local/api/health
```

### HTTPS local com mkcert

Instale a CA local e gere os certificados:

```bash
mkcert -install
mkcert -cert-file certs/zentry.local.pem -key-file certs/zentry.local-key.pem zentry.local localhost 127.0.0.1 ::1
```

Configure o host local apontando para `127.0.0.1`:

```txt
127.0.0.1 zentry.local
```

No Windows, esse mapeamento fica em:

```txt
C:\Windows\System32\drivers\etc\hosts
```

Com o Nginx ativo, `http://zentry.local` redireciona automaticamente para
`https://zentry.local`.

Para rodar a imagem do backend manualmente fora do Compose, informe o arquivo de
ambiente e publique a porta explicitamente:

```bash
docker build -t zentry-api ./Services_backend
docker run --rm --env-file ./Services_backend/.env -p 3000:3000 zentry-api
```

O container nao deve receber segredos por build nem copiar `.env` para a imagem.
As variaveis sao injetadas em tempo de execucao pelo `env_file` do Compose ou por
`docker run --env-file`.

Para subir apenas o backend dentro da rede Docker, use:

```bash
docker compose up --build backend
```

Nesse modo o backend nao fica disponivel em `localhost:3000`; ele fica
disponivel apenas para outros servicos do Compose pelo endereco `backend:3000`.

Para subir o PgAdmin junto com o backend, preencha `PGADMIN_DEFAULT_EMAIL` e
`PGADMIN_DEFAULT_PASSWORD` no `.env` e use o profile de ferramentas:

```bash
docker compose --profile tools up --build
```

O Nginx serve o frontend em `http://localhost` e encaminha `/api` para o
backend dentro da rede Docker.

### Headers de seguranca no Nginx

O Nginx adiciona headers HTTP basicos para reduzir riscos comuns:

1. `X-Frame-Options`: reduz risco de clickjacking.
2. `X-Content-Type-Options`: evita MIME sniffing.
3. `Referrer-Policy`: limita envio de origem em navegacao externa.
4. `Permissions-Policy`: bloqueia camera, microfone e geolocalizacao por padrao.
5. `Content-Security-Policy`: restringe scripts, estilos, fontes, imagens e conexoes permitidas.

## 9. Fluxo recomendado para novos devs

1. Clonar o projeto.
2. Rodar `npm install`.
3. Configurar `.env`.
4. Rodar `npm run db:migrate`.
5. Rodar `npm run dev`.
6. Para testes seguros sem custo cloud:
   1. Subir Postgres Docker local.
   2. Configurar `.env.test`.
   3. Rodar `npm run db:migrate:test`.
   4. Rodar `npm run dev:test` e `npm run test`.
