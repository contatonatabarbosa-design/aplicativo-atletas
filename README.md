# Aplicativo Atletas

SaaS multi-clube para gestão de atletas (foco em futebol americano). React + TypeScript + Tailwind + Supabase.

## 1. Arquitetura e fluxo

```
Navegador (React SPA, Vercel/Netlify)
   │  supabase-js (anon key + JWT do usuário)
   ▼
Supabase: Auth ─ PostgreSQL (RLS) ─ Storage (logos)
```

**Multi-clube.** Toda tabela de negócio tem `club_id` (preenchido por padrão com `auth_club_id()`, derivado do perfil de quem está logado). A RLS compara `club_id` com o clube do usuário, então um clube nunca enxerga dados de outro, mesmo que o front-end tenha bugs. O front nunca envia `club_id`.

**Entrada de usuários (sem código manual):**
- *Gestor*: tela “Quero cadastrar meu clube” → `signUp` com `club_name` nos metadados → trigger cria `clubs` + `profiles(role='manager')`.
- *Atleta*: o gestor cadastra o atleta (com e-mail) → o atleta usa “Primeiro acesso” com o mesmo e-mail → trigger cria `profiles(role='athlete')` e vincula `athletes.profile_id`. Se a conta já existir antes do cadastro, outra trigger faz o vínculo no momento em que o gestor salva o atleta.

**Painel macro (`/gestor`)**: Painel (cards + atividade recente), Atletas (busca, filtro por posição e mensalidade, IMC ao vivo no formulário), Mensalidades, Playbook, Drills, Treinos, Parceiros e Clube (nome, cor, logo). Todas as telas de cadastro usam um único componente genérico, `CrudPage`.

**Portal do atleta (`/atleta`)**: Meu perfil (idade e IMC automáticos), Playbook (Geral / Minha posição), Drills (com registro de conclusão e observações), Treinos (formulário, histórico e gráfico de evolução) e Parceiros.

**Idade e IMC.** No banco: `bmi` é coluna gerada; `calc_age()` e `bmi_class()` alimentam a view `athletes_overview`. No front: `src/lib/calc.ts` repete o cálculo apenas para a prévia ao vivo do formulário.

**Mensalidade em dia/pendente** é derivada de `payments`: o atleta está “pendente” se houver lançamento pendente/atrasado com mês de referência até o mês atual.

## 2. Banco de dados

Cole `supabase/schema.sql` no SQL Editor do Supabase e execute. Ele cria tabelas, funções, view, triggers, RLS e o bucket `club-assets`. Além das tabelas pedidas, foram acrescentadas `payments` (mensalidades) e `drill_completions` (conclusão de drills).

## 3. Estrutura de pastas

```
supabase/schema.sql
src/
  main.tsx, App.tsx          rotas e proteção por papel
  types.ts                   tipos do domínio
  lib/    supabase.ts  calc.ts  constants.ts
  contexts/AuthContext.tsx   sessão, perfil, clube e cor do tema
  hooks/useMyAthlete.ts
  components/ Layout  Modal  StatCard  CrudPage
  pages/Login.tsx
  pages/manager/  Dashboard  AthletesPage  PaymentsPage  ContentPages  WorkoutsAdminPage  ClubSettings
  pages/athlete/  MyProfile  MyPlaybook  MyDrills  MyWorkouts  MyPartners
```

Para adicionar um módulo novo: crie a tabela (com `club_id` e policies), depois uma página com `<CrudPage … />`.
Para outro esporte: edite `POSITIONS` em `src/lib/constants.ts`.

## 4. Deploy passo a passo

1. **Supabase**: crie o projeto em supabase.com → SQL Editor → cole e execute `supabase/schema.sql`.
2. **Auth**: Authentication → Providers → Email. Mantenha *Confirm email* ligado em produção (impede que alguém assuma o e-mail de um atleta). Em *URL Configuration*, defina o *Site URL* com o link final da Vercel.
3. **Chaves**: Project Settings → API → copie *Project URL* e *anon public key*.
4. **Local (opcional)**: `cp .env.example .env`, preencha, rode `npm install && npm run dev`.
5. **GitHub**: `git init && git add . && git commit -m "primeira versão"`, crie um repositório e faça push.
6. **Vercel**: Add New → Project → importe o repositório (Framework: Vite; build `npm run build`; saída `dist`). Em *Environment Variables*, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Clique em Deploy. O `vercel.json` já cuida das rotas da SPA. (Netlify: mesmas variáveis; `public/_redirects` já está incluído.)
7. **Primeiro uso**: abra o link → “Quero cadastrar meu clube” → entre como gestor → cadastre atletas → envie o link aos atletas para o “Primeiro acesso”.

## Limites conhecidos e próximos passos

- Atletas só leem a própria ficha; peso/altura são atualizados pelo gestor. Para permitir autoatualização, crie uma função RPC restrita a essas colunas.
- O auto-cadastro de clube está aberto a qualquer pessoa (modelo SaaS). Para vender por assinatura, adicione uma tabela de plano/assinatura (ex.: Stripe) e condicione a criação do clube.
- Mensalidades são lançadas manualmente; uma Edge Function agendada pode gerar as cobranças do mês.
- Checagem de tipos e build (`npm run build`) devem ser rodados no seu ambiente após `npm install`.
