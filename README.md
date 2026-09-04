<a href="https://github.com/seu-usuario" target="_blank">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:B71C1C,100:FF1744&height=200&section=header&text=WorkFlow&fontSize=80&fontAlignY=35&animation=fadeIn&fontColor=white" width="100%"/>
</a>

![Status](https://img.shields.io/badge/status-ativo-brightgreen)

## 🚀 Do Zero ao Deploy Local

**Guia definitivo para rodar backend e frontend localmente — na ordem certa, sem surpresas.**

Siga cada etapa rigorosamente. Pular passos é o caminho mais curto para dores de cabeça com **CORS**, **tokens inconsistentes** e **variáveis de ambiente mal configuradas**. Nós já passamos por isso para que você não precise.

**Equipe Docs/DevOps** 

---
## 🧰 Pré-requisitos

![Node.js](https://img.shields.io/badge/-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white&labelColor=2D2D2D)
![pnpm](https://img.shields.io/badge/-pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white&labelColor=2D2D2D)
![Docker](https://img.shields.io/badge/-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white&labelColor=2D2D2D)

# ⚠️ ATENÇÃO! ⚠️
<!-- Badge -->
<p align="center">
  <img src="https://img.shields.io/badge/%F0%9F%9A%A8-USE%20SEMPRE%20pnpm-FF0000?style=for-the-badge&logo=pnpm&logoColor=white&labelColor=1E1E1E" 
       alt="Use sempre pnpm" />
</p>

<!-- Aviso -->
<blockquote>
  <p align="center">
    <strong>⚠️ IMPORTANTE:</strong> Use sempre <code>pnpm</code>, <strong>nunca</strong> <code>npm</code>.
  </p>
  <p align="center">
    Ambos os repositórios possuem <code>pnpm-lock.yaml</code>. Instalar ou rodar com <code>npm</code> gera 
    <strong>inconsistência de versões</strong> e pode até <strong>não funcionar</strong> 
    (<code>npm run dev</code> falha porque as dependências não batem com o que o projeto espera).
  </p>
</blockquote>

<p align="center">
  <img src="https://img.shields.io/badge/%F0%9F%90%B3-Docker%20Desktop%20instalado%20%26%20ABERTO-2496ED?style=for-the-badge&logo=docker&logoColor=white&labelColor=1E1E1E" 
       alt="Docker Desktop instalado e aberto" />
</p>

## 1. Backend
```bash
git clone https://github.com/maysanazario/backend_fatecProjeto.git
cd backend_fatecProjeto
pnpm install
```
Se aparecer `ERR_PNPM_IGNORED_BUILDS`, rode:
```bash
pnpm approve-builds
# marca todos pressionando a tecla 'a' (prisma, @prisma/client, argon2, esbuild, etc.) e confirma pressionando 'enter'
pnpm install
```
## Banco de dados (Docker)

```bash
docker compose up -d
```

Sobe MySQL 8 e o Adminer (`http://localhost:8080`).

<blockquote>
  <p align="center">
    <strong>⚠️ IMPORTANTE:</strong> A porta exposta é <code>3307</code>, <strong>não</strong> <code>3306</code>.
  </p>
  <p align="center">
    O <code>docker-compose.yml</code> mapeia essa porta de propósito, para <strong>não conflitar</strong> 
    com um MySQL local que a pessoa já tenha. O <code>.env.example</code> mostra <code>3306</code> — 
    <strong>precisa trocar</strong>.
  </p>
</blockquote>

<blockquote>
  <p align="center">
    <strong>⚠️ AVISO DE PORTAS (Ambiente Acadêmico / Redes Restritas)</strong>
  </p>
  
  <p align="left">
    <strong>1️⃣ MySQL:</strong>
    <br />
    &nbsp;&nbsp;• Porta no host: <code>3307</code>
    <br />
    &nbsp;&nbsp;• Porta no container: <code>3306</code>
    <br />
    &nbsp;&nbsp;• <em>(Mapeamento feito propositalmente para não conflitar com MySQL local)</em>
  </p>
  
  <p align="left">
    <strong>2️⃣ Adminer (Interface Web):</strong>
    <br />
    &nbsp;&nbsp;• Acesse: <code>http://localhost:8080</code>
    <br />
    &nbsp;&nbsp;• Server: <code>db</code> | User: <code>root</code> | Pass: <code>root</code> | DB: <code>workflow_fatec</code>
  </p>
  
  <p align="left">
    <strong>3️⃣ Se a porta 8080 estiver em uso:</strong>
    <br />
    &nbsp;&nbsp;• Edite o <code>docker-compose.yml</code>
    <br />
    &nbsp;&nbsp;• Altere <code>"8080:8080"</code> para <code>"8081:8080"</code> (ou porta disponível)
    <br />
    &nbsp;&nbsp;• Exemplo: <code>ports: - "8081:8080"</code>
  </p>
</blockquote>

## Variáveis de ambiente

```bash
cp .env.example .env
```

No `.env`, ajuste:

```dotenv
DATABASE_URL="mysql://root:root@localhost:3307/workflow_fatec"
CORS_ORIGIN=http://localhost:3000,http://192.168.152.1:3000
APP_WEB_URL=http://localhost:3000
```

- `CORS_ORIGIN` por padrão vem `http://localhost:5173` (porta de outro framework) — se não trocar pra `3000`, o login falha com "Failed to fetch" (é CORS bloqueado, mas o navegador não deixa claro).
- `APP_WEB_URL` é usado pra montar os links de e-mail (reset de senha, primeiro acesso).
- **Anote os valores de `JWT_ACCESS_SECRET`, `JWT_ISSUER` e `JWT_AUDIENCE`** — o frontend precisa dos mesmos valores exatos (ver seção do frontend).

## Banco: gerar client e aplicar schema

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

### Popular com usuários de teste

```bash
pnpm prisma:seed
```

Cria:

| Papel | Login | Senha | Observação |
|---|---|---|---|
| Administrador | `admin@example.com` | `wf-fatec2026` | Entra direto |
| Secretaria (Backoffice) | `ana.costa@fatec.sp.gov.br` | `Fatec@2026` | Pede troca de senha no 1º acesso |
| Aluno | RA `123456789` | `Fatec@2026` | Pede troca de senha no 1º acesso |
| Aluno | RA `987654321` | `Fatec@2026` | Pede troca de senha no 1º acesso |
| Aluno | RA `998877665` | `Fatec@2026` | Pede troca de senha no 1º acesso |

### Rodar

```bash
pnpm dev
```

Sobe em `http://localhost:3333`.

---
## 2. Frontend

```bash
git clone https://github.com/maysanazario/frontend_fatecProjeto.git
cd frontend_fatecProjeto
pnpm install
```

Se aparecer `ERR_PNPM_IGNORED_BUILDS`, mesmo procedimento do backend (`pnpm approve-builds` + `pnpm install` de novo).

### Variáveis de ambiente

```bash
cp .env.example .env.local
```

⚠️ **Tem que ser `.env.local`, não `.env`** — é a convenção do Next.js, e sem isso `NEXT_PUBLIC_API_BASE_URL` fica vazia (o fetch do login cai em `localhost:3000/auth/login`, que não existe, e dá 404 disfarçado de erro genérico).

No `.env.local`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:3333
JWT_ACCESS_SECRET=<mesmo valor do .env do backend>
JWT_ISSUER=<mesmo valor do .env do backend>
JWT_AUDIENCE=<mesmo valor do .env do backend>
```

⚠️ **Ponto que mais confunde:** o `middleware.ts` do frontend valida o JWT de novo no servidor (pra proteger as rotas `/admin` e `/aluno`). Se `JWT_ACCESS_SECRET` (e issuer/audience) não forem **idênticos** aos do backend, a verificação falha silenciosamente — o login parece funcionar (token é gerado, toast de sucesso aparece), mas a pessoa é redirecionada de volta pro `/login` sem nenhuma mensagem de erro.

### Rodar

```bash
pnpm dev
```

Sobe em `http://localhost:3000`.

---

## Ordem recomendada pra testar do zero

1. Backend rodando (`pnpm dev` no terminal 1)
2. Frontend rodando (`pnpm dev` no terminal 2)
3. Acessar `http://localhost:3000/login`
4. Testar aba "Funcionário" com `admin@example.com` / `wf-fatec2026` → deve cair em `/admin/home`
5. Testar aba "Aluno (RA)" com RA `123456789` / `Fatec@2026` → espera-se erro 428 (obrigatoriedade de trocar senha), fluxo de "Primeiro acesso"

## Bug conhecido (ainda não corrigido em produção)

Na tela de login, os campos das abas "Funcionário" e "Aluno (RA)" compartilhavam o mesmo estado (`identifier`), e havia uma troca automática de aba enquanto a pessoa digitava um e-mail (detectava padrão de RA no meio da digitação). Corrigido localmente em `app/(public)/login/LoginContent.tsx`:
- Removida a troca automática de aba em `handleIdentifierChange`.
- Criada `handleModeChange`, que limpa o campo (`identifier`) ao trocar de aba manualmente.

# Guia de Commits e Colaboração

## 🎯 Convenção de Commits

Seguimos o padrão **Conventional Commits** para manter o histórico organizado e facilitar a geração automática de changelogs.

### Formato Padrão:

```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé opcional]
```

### Regras Importantes:

* ✅ Use **presente do indicativo** ("adiciona" não "adicionado")
* ✅ Primeira letra **minúscula** na descrição
* ✅ **Sem ponto final** na descrição
* ✅ Máximo **50 caracteres** no título
* ✅ Linha em branco entre título e corpo
* ✅ Corpo com máximo **72 caracteres** por linha

---

## 🛠️ Instalação e Execução

### 1. Preparar Variáveis de Ambiente
Navegue até a pasta do backend e crie o arquivo `.env` a partir do modelo `.env.example`:

```bash
cd backend_fatecProjeto
cp .env.example .env
```

#### ⚙️ Configurações de Ambiente (`.env`):
Abra o arquivo `.env` recém-criado e configure as variáveis principais:

* **`CORS_ORIGIN` e `APP_WEB_URL`**:
  Devem conter a URL exata do servidor onde o seu frontend está sendo executado (exemplo: `http://localhost:3000`).
  > 💡 **Dica:** Caso utilize portas ou origens adicionais (como `http://localhost:5173`), você pode especificar múltiplos endereços separando-os por vírgula (`http://localhost:3000,http://localhost:5173`).

* **`DATABASE_URL`**:
  String de conexão com o banco de dados MySQL seguindo o padrão:
  `DATABASE_URL="mysql://<USUARIO>:<SENHA>@localhost:<PORTA>/<NOME_DO_BANCO>"`
  
  > 📌 **Porta Externa Mapeada:** Por padrão no arquivo `docker-compose.yml`, o serviço expõe o MySQL na porta **`3307`** (para evitar conflito caso você já possua um MySQL rodando localmente na porta 3306).  
  > **Exemplo padrão:** `DATABASE_URL="mysql://root:root@localhost:3307/workflow_fatec"`

---

### 2. Subir o Banco de Dados (MySQL + Adminer via Docker)

Abra o aplicativo **Docker Desktop** na sua máquina e execute o comando abaixo para iniciar os contêineres do banco de dados e da ferramenta de administração:

```bash
docker compose up -d
```

> ⚠️ **Aviso de Portas (Ambiente Acadêmico / Redes Restritas):**
> - **MySQL:** Roda na porta host `3307` (mapeada para `3306` dentro do contêiner).
> - **Adminer (Interface web do banco):** Fica acessível por padrão em `http://localhost:8080` (Server: `db`, User: `root`, Pass: `root`, DB: `workflow_fatec`).
> - Se a porta `8080` estiver em uso em computadores de laboratório, altere o mapeamento no `docker-compose.yml` (por exemplo, de `"8080:8080"` para `"8081:8080"`).

---

### 3. Instalar Dependências e Executar Migrações do Banco

Com o contêiner do banco ativo, execute a instalação dos pacotes e a preparação do schema com o Prisma:

```bash
# Instalação das dependências
npm install

# Geração do client Prisma e criação das tabelas no MySQL
npm run prisma:generate
npm run prisma:push

# Inicialização de dados padrão no banco (categorias, setores, papéis e usuários)
npm run seed
```

#### 🔑 Credenciais Padrão do Seed (`npm run seed`):
Ao executar o seed, o banco é populado com contas iniciais para testes de desenvolvimento:

- **Administrador (Painel / Aba Funcionário):**
  - **E-mail:** `admin@example.com`
  - **Senha:** `wf-fatec2026`
- **Usuários de Teste (Alunos / Secretaria):**
  - **Exemplos de E-mail:** `joao.silva@aluno.fatec.sp.gov.br`, `ana.costa@fatec.sp.gov.br`
  - **Senha inicial:** `Fatec@2026` *(exige redefinição no 1º acesso)*

*(Nota: As credenciais de teste são definidas em `prisma/seed.js` e podem ser alteradas no script conforme a necessidade do projeto).*

---

### 4. Iniciar a API Backend

```bash
npm run dev
```

A API estará rodando em `http://localhost:3333`.
* **Documentação Interativa (Swagger):** `http://localhost:3333/docs`
* **Status do Servidor (Health check):** `http://localhost:3333/health`

---

## ⚠️ Troubleshooting (Problemas Comuns)

#### 1. Erro `P1001: Can't reach database server`
* **Causa:** O contêiner MySQL do Docker não está rodando ou a porta no `.env` não é a mesma exposta pelo Docker (`3307`).
* **Solução:** Verifique no Docker Desktop se os contêineres estão ativos e confirme se a `DATABASE_URL` no `.env` aponta para a porta configurada no `docker-compose.yml`.

#### 2. Erro de Bloqueio de CORS ao fazer requisições
* **Causa:** A origem da requisição do frontend (ex: `http://localhost:3000`) não está listada no `CORS_ORIGIN` do arquivo `.env` do backend.
* **Solução:** Adicione a URL do frontend na variável `CORS_ORIGIN` no `.env` e reinicie o backend (`npm run dev`).
