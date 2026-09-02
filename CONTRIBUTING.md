# Guia de Boas Práticas — Criação de Issues

**Projeto:** Sistema FATEC (`frontend_fatecProjeto` + `backend_fatecProjeto`)
**Mantido por:** Equipe de Docs/DevOps

## Objetivo

Padronizar como as issues são abertas nos dois repositórios, para que qualquer pessoa do time consiga, só de olhar o título e suas labels, entender **a urgência**, **o tipo de problema**, **quem abriu** e **quem é responsável por resolver** — sem precisar abrir a issue.

Este guia formaliza um padrão que já estamos utilizando e arrumando na seção Issues do GitHub.

---

# Formato obrigatório do título

```text
[Tipo] Descrição curta e objetiva
```

Além do título, a issue deve possuir **4 labels em ordem**:

1. **Prioridade**
2. **Tipo de Problema**
3. **Equipe Criadora**
4. **Equipe Responsável**

> **Sempre utilizem as Labels.**
> Nenhuma label pode ser pulada. Se uma informação ainda não é conhecida no momento da criação (ex.: equipe responsável ainda não definida), usar `team:undefined` naquela posição em vez de omitir a label.

## Exemplo completo

```text
[Security] Corrigir senha hardcoded em crypto.ts
```

**Labels:**

```text
priority:high
security
team:qa
team:refatoracao
```

Lendo da esquerda para a direita, qualquer pessoa já sabe: é **urgente**, é um problema de **segurança**, foi **encontrado pelo QA**, e é o **time de refatoração** quem vai resolver.

---

# 1ª Label — Prioridade

| Label               | Quando usar                                                             |
| ------------------- | ----------------------------------------------------------------------- |
| `priority:critical` | Sistema quebrado, dado exposto, vulnerabilidade ativa — trate **agora** |
| `priority:high`     | Impacta funcionalidade importante ou segurança, mas não é incêndio      |
| `priority:médium`   | Deveria ser corrigido no próximo ciclo, mas não bloqueia ninguém        |
| `priority:low`      | Cosmético, débito técnico, "seria bom ter"                              |

---

# 2ª Label — Tipo de problema

| Label        | Significado                                                                       |
| ------------ | --------------------------------------------------------------------------------- |
| `[Security]` | Vulnerabilidade, segredo exposto, falha de autenticação/autorização               |
| `[Bug]`      | Comportamento incorreto no sistema já em produção/funcional                       |
| `[Fix]`      | Correção pontual (import quebrado, config errada) sem ser um bug de comportamento |
| `[Refactor]` | Melhoria interna de código, sem mudar comportamento externo                       |
| `[A11y]`     | Acessibilidade                                                                    |
| `[Test]`     | Cobertura, correção ou configuração de testes automatizados                       |
| `[Style]`    | CSS, espaçamento, visual — sem impacto funcional                                  |
| `[Cleanup]`  | Código morto, variável não usada, remoção de código obsoleto                      |
| `[Feature]`  | Nova funcionalidade                                                               |
| `[Docs]`     | Documentação (README, comentários, guias)                                         |

---

# 3ª e 4ª Labels — Equipe criadora → Equipe responsável

Formato:

```text
[Equipe-Criadora → Equipe-Responsável]
```

Porque quase sempre é a mesma pessoa/equipe preenchendo as duas de uma vez ao abrir a issue.

| Label                 | Equipe                                     |
| --------------------- | ------------------------------------------ |
| `team:qa`             | Qualidade / Revisão                        |
| `teams:novas-funcs-1` | Time de Novas Funcionalidades I            |
| `teams:novas-funcs-2` | Time de Novas Funcionalidades II           |
| `team:refatoracao`    | Time de Refatoração                        |
| `team:ux-ui`          | UX / UI                                    |
| `team:docs-devops`    | Documentação / DevOps                      |
| `team:undefined`      | Ainda não triado — só usar temporariamente |

## Exemplos

* `[QA → Refatoracao]` — QA encontrou o problema, Refatoração resolve.
* `[UI/UX → UI/UX]` — o próprio time achou e vai resolver (mais comum no dia a dia).
* `[Refatoracao → A definir]` — aberta pelo time de Refatoração, ainda sem dono definido (trocar assim que houver).

Se a issue já foi triada e a equipe responsável mudou, **edite a label** para refletir o novo dono — não deixe o título desatualizado.

---

# Regras de ouro

1. **Nunca pule uma label.**
   Se não souber, use `team:undefined` — não deixe a posição vazia nem invente.

2. **Uma issue, um problema.**
   Se o título tiver "e" conectando dois problemas diferentes, provavelmente deveria ser duas issues (ou uma Issue Principal com sub-issues — ver seção abaixo).

3. **Título curto, corpo detalhado.**
   O título só carrega a tag de problema + um resumo de uma linha; contexto, critério de aceite e arquivos afetados vão no corpo.

4. **Ao fechar como duplicada ou inválida**, mantenha o título como está (não apague a tag) e só adicione a label `duplicate`/`invalid` — isso preserva o histórico de auditoria.

5. **Labels e título sempre em sincronia.**
   Toda tag no título deve ter a label correspondente aplicada na issue. Isso facilita filtrar por:

   ```text
   is:issue label:priority:high
   ```

   sem depender apenas do texto do título.

---

# Issues Principais (Pai) e Sub-Issues

Quando várias issues compartilham o mesmo tipo de problema (ex.: 73 ocorrências de botão sem `type`), agrupe sob uma **Issue Principal** usando o recurso nativo de *Sub-issues* do GitHub.

* A **Issue Principal** segue o mesmo padrão de 4 labels, representando o problema como um todo.
* Cada **sub-issue individual** mantém suas próprias 4 labels — não herda automaticamente da Pai, porque uma sub-issue pode, por exemplo, ter prioridade diferente das demais do grupo.
* A **Issue Principal** deve conter:

  * `## Contexto`
  * `## Arquivos afetados`
  * `## Critério de aceite`

  Esses itens devem seguir o modelo usado nas issues já criadas para os grupos consolidados.

---

# Checklist rápido antes de publicar a issue

* [ ] Título segue `[Tipo] Descrição` + 4 Labels em ordem.
* [ ] Nenhuma label ficou vazia (usei `team:undefined` onde não sabia).
* [ ] Corpo tem contexto suficiente para quem for resolver (não só "ver imagem").
* [ ] Se for um problema recorrente/em lote, considerei agrupar como **Issue Principal + Sub-issues**.
