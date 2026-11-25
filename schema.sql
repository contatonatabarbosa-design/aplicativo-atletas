-- =====================================================================
-- Aplicativo Atletas — Schema multi-clube (Supabase / PostgreSQL)
-- Cole tudo no SQL Editor do Supabase e execute uma vez.
-- =====================================================================

-- ---------- 1. TABELAS ------------------------------------------------

create table public.clubs (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  logo_url        text,
  primary_color   text not null default '#1c4d35',
  secondary_color text not null default '#f0c030',
  created_at      timestamptz not null default now()
);

-- Um perfil por usuário do Supabase Auth. Define papel e clube.
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  club_id    uuid not null references public.clubs(id) on delete cascade,
  role       text not null check (role in ('manager','athlete')),
  full_name  text not null,
  created_at timestamptz not null default now()
);
create index on public.profiles(club_id);

-- Helpers de sessão (SECURITY DEFINER evita recursão de RLS em profiles).
create or replace function public.auth_club_id() returns uuid
language sql stable security definer set search_path = public as
$$ select club_id from public.profiles where id = auth.uid() $$;

create or replace function public.is_manager() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce((select role = 'manager' from public.profiles where id = auth.uid()), false) $$;

create table public.athletes (
  id            uuid primary key default gen_random_uuid(),
  club_id       uuid not null default public.auth_club_id() references public.clubs(id) on delete cascade,
  profile_id    uuid unique references public.profiles(id) on delete set null,
  full_name     text not null,
  email         text,                       -- usado para vincular o login do atleta
  phone         text,
  birth_date    date,
  height_cm     numeric(5,1) check (height_cm is null or height_cm between 50 and 260),
  weight_kg     numeric(5,1) check (weight_kg is null or weight_kg between 20 and 300),
  -- IMC calculado automaticamente pelo banco
  bmi           numeric(4,1) generated always as (
                  case when height_cm > 0 and weight_kg > 0
                       then round(weight_kg / power(height_cm / 100.0, 2), 1) end
                ) stored,
  position      text,                       -- QB, WR, OL...
  jersey_number int check (jersey_number is null or jersey_number between 0 and 99),
  joined_at     date default current_date,
  status        text not null default 'active' check (status in ('active','inactive')),
  created_at    timestamptz not null default now()
);
create index on public.athletes(club_id);
create unique index athletes_club_email_uk on public.athletes(club_id, lower(email)) where email is not null;

create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid not null default public.auth_club_id() references public.clubs(id) on delete cascade,
  athlete_id      uuid not null references public.athletes(id) on delete cascade,
  reference_month date not null,            -- sempre o dia 1 do mês de referência
  amount          numeric(10,2) not null default 0,
  status          text not null default 'pending' check (status in ('paid','pending','overdue')),
  paid_at         date,
  created_at      timestamptz not null default now()
);
create index on public.payments(club_id, athlete_id);

create table public.playbooks (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null default public.auth_club_id() references public.clubs(id) on delete cascade,
  title      text not null,
  scope      text not null default 'general' check (scope in ('general','position')),
  position   text,
  content    text,
  tags       text[] not null default '{}',
  media_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  check (scope = 'general' or position is not null)
);
create index on public.playbooks(club_id);

create table public.drills (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null default public.auth_club_id() references public.clubs(id) on delete cascade,
  position     text not null,
  title        text not null,
  objective    text,
  instructions text,
  media_url    text,
  created_at   timestamptz not null default now()
);
create index on public.drills(club_id, position);

-- Registro de conclusão de drills pelo atleta.
create table public.drill_completions (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null default public.auth_club_id() references public.clubs(id) on delete cascade,
  drill_id     uuid not null references public.drills(id) on delete cascade,
  athlete_id   uuid not null references public.athletes(id) on delete cascade,
  notes        text,
  completed_at timestamptz not null default now()
);
create index on public.drill_completions(athlete_id, drill_id);

create table public.workout_logs (
  id               uuid primary key default gen_random_uuid(),
  club_id          uuid not null default public.auth_club_id() references public.clubs(id) on delete cascade,
  athlete_id       uuid not null references public.athletes(id) on delete cascade,
  logged_on        date not null default current_date,
  category         text not null check (category in ('gym','performance')),
  exercise         text not null,           -- ex.: "Supino reto" ou "Sprint 40 jardas"
  muscle_group     text,
  load_kg          numeric(6,1),
  sets             int,
  reps             int,
  distance_m       numeric(8,1),
  speed_kmh        numeric(5,2),
  duration_seconds numeric(8,2),
  notes            text,
  created_at       timestamptz not null default now()
);
create index on public.workout_logs(club_id, athlete_id, logged_on desc);

create table public.partners (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null default public.auth_club_id() references public.clubs(id) on delete cascade,
  name       text not null,
  category   text,
  address    text,
  benefit    text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.partners(club_id);

-- ---------- 2. FUNÇÕES AUXILIARES (idade, classificação do IMC) -------

create or replace function public.calc_age(birth date) returns int
language sql stable as
$$ select case when birth is null then null else date_part('year', age(current_date, birth))::int end $$;

create or replace function public.bmi_class(b numeric) returns text
language sql immutable as $$
  select case
    when b is null then null
    when b < 18.5 then 'Abaixo do peso'
    when b < 25   then 'Peso normal'
    when b < 30   then 'Sobrepeso'
    when b < 35   then 'Obesidade grau I'
    when b < 40   then 'Obesidade grau II'
    else 'Obesidade grau III' end
$$;

-- Funções de contexto do atleta logado.
create or replace function public.auth_athlete_id() returns uuid
language sql stable security definer set search_path = public as
$$ select id from public.athletes where profile_id = auth.uid() limit 1 $$;

create or replace function public.auth_athlete_position() returns text
language sql stable security definer set search_path = public as
$$ select position from public.athletes where profile_id = auth.uid() limit 1 $$;

-- View com idade, classificação do IMC e situação da mensalidade.
-- security_invoker = true => a RLS das tabelas base continua valendo.
create or replace view public.athletes_overview with (security_invoker = true) as
select a.*,
       public.calc_age(a.birth_date) as age,
       public.bmi_class(a.bmi)       as bmi_class,
       case when exists (
              select 1 from public.payments p
              where p.athlete_id = a.id
                and p.status in ('pending','overdue')
                and p.reference_month <= date_trunc('month', current_date)::date)
            then 'pending' else 'paid' end as payment_status
from public.athletes a;

-- ---------- 3. ONBOARDING (triggers em auth.users e athletes) ---------

-- Novo usuário:
--  a) com metadata club_name  -> cria clube + perfil de gestor (auto-cadastro SaaS)
--  b) senão, se o e-mail existe em athletes -> cria perfil de atleta e vincula
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_club uuid; v_athlete uuid;
  v_name text := coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1));
  v_club_name text := nullif(new.raw_user_meta_data->>'club_name','');
begin
  if v_club_name is not null then
    insert into public.clubs(name, slug)
    values (v_club_name,
            regexp_replace(lower(v_club_name), '[^a-z0-9]+', '-', 'g') || '-' || substr(gen_random_uuid()::text, 1, 6))
    returning id into v_club;
    insert into public.profiles(id, club_id, role, full_name) values (new.id, v_club, 'manager', v_name);
  else
    select id, club_id into v_athlete, v_club from public.athletes
     where lower(email) = lower(new.email) and profile_id is null limit 1;
    if v_athlete is not null then
      insert into public.profiles(id, club_id, role, full_name) values (new.id, v_club, 'athlete', v_name);
      update public.athletes set profile_id = new.id where id = v_athlete;
    end if;
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Gestor cadastra atleta cujo e-mail já tem conta: vincula automaticamente.
create or replace function public.link_existing_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_uid uuid;
begin
  if new.email is not null and new.profile_id is null then
    select u.id into v_uid from auth.users u
     where lower(u.email) = lower(new.email)
       and not exists (select 1 from public.profiles p where p.id = u.id);
    if v_uid is not null then
      insert into public.profiles(id, club_id, role, full_name) values (v_uid, new.club_id, 'athlete', new.full_name);
      new.profile_id := v_uid;
    end if;
  end if;
  return new;
end $$;

create trigger athletes_link_user before insert on public.athletes
  for each row execute function public.link_existing_user();

-- ---------- 4. ROW LEVEL SECURITY ------------------------------------

alter table public.clubs             enable row level security;
alter table public.profiles          enable row level security;
alter table public.athletes          enable row level security;
alter table public.payments          enable row level security;
alter table public.playbooks         enable row level security;
alter table public.drills            enable row level security;
alter table public.drill_completions enable row level security;
alter table public.workout_logs      enable row level security;
alter table public.partners          enable row level security;

-- clubs: todos do clube leem; só gestor altera (criação via trigger).
create policy clubs_select on public.clubs for select using (id = public.auth_club_id());
create policy clubs_update on public.clubs for update
  using (id = public.auth_club_id() and public.is_manager())
  with check (id = public.auth_club_id() and public.is_manager());

-- profiles: lê o próprio; gestor lê os do clube. Só o nome é editável.
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or (club_id = public.auth_club_id() and public.is_manager()));
create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant  update (full_name) on public.profiles to authenticated;

-- Gestor: acesso total aos dados do próprio clube.
do $$
declare t text;
begin
  foreach t in array array['athletes','payments','playbooks','drills','drill_completions','workout_logs','partners']
  loop
    execute format($f$create policy %I on public.%I for all
      using (club_id = public.auth_club_id() and public.is_manager())
      with check (club_id = public.auth_club_id() and public.is_manager())$f$, t || '_manager_all', t);
  end loop;
end $$;

-- Atleta: leitura restrita.
create policy athletes_self_select on public.athletes for select using (profile_id = auth.uid());
create policy payments_self_select on public.payments for select using (athlete_id = public.auth_athlete_id());
create policy playbooks_athlete_select on public.playbooks for select
  using (club_id = public.auth_club_id() and (scope = 'general' or position = public.auth_athlete_position()));
create policy drills_athlete_select on public.drills for select
  using (club_id = public.auth_club_id() and position = public.auth_athlete_position());
create policy partners_athlete_select on public.partners for select
  using (club_id = public.auth_club_id() and active);

-- Atleta: escreve apenas os próprios registros.
create policy completions_self_all on public.drill_completions for all
  using (athlete_id = public.auth_athlete_id())
  with check (athlete_id = public.auth_athlete_id() and club_id = public.auth_club_id());
create policy workouts_self_all on public.workout_logs for all
  using (athlete_id = public.auth_athlete_id())
  with check (athlete_id = public.auth_athlete_id() and club_id = public.auth_club_id());

-- ---------- 5. STORAGE (logos do clube) ------------------------------

insert into storage.buckets (id, name, public) values ('club-assets', 'club-assets', true)
on conflict (id) do nothing;

-- Leitura pública (o bucket é público); escrita só do gestor, na pasta do próprio clube.
create policy club_assets_write on storage.objects for insert to authenticated
  with check (bucket_id = 'club-assets' and public.is_manager()
              and (storage.foldername(name))[1] = public.auth_club_id()::text);
create policy club_assets_update on storage.objects for update to authenticated
  using (bucket_id = 'club-assets' and public.is_manager()
         and (storage.foldername(name))[1] = public.auth_club_id()::text);
create policy club_assets_delete on storage.objects for delete to authenticated
  using (bucket_id = 'club-assets' and public.is_manager()
         and (storage.foldername(name))[1] = public.auth_club_id()::text);
