-- Keep the Focus: schema iniziale
-- Da eseguire una volta nello SQL Editor di Supabase (o con `supabase db push`).

-- ───────────────────────── Tabelle ─────────────────────────

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null unique check (char_length(username) between 2 and 30),
  created_at  timestamptz not null default now()
);

create table public.circles (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 50),
  invite_code  text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_by   uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now()
);

create table public.circle_members (
  circle_id  uuid not null references public.circles (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (circle_id, user_id)
);

-- Una sessione di studio = un periodo di timer senza interruzioni.
-- ended_at nullo significa che il timer sta ancora andando.
create table public.study_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  points      integer,
  check (ended_at is null or ended_at >= started_at)
);

-- Al massimo un timer attivo per persona.
create unique index study_sessions_one_running
  on public.study_sessions (user_id) where ended_at is null;
create index study_sessions_user_started on public.study_sessions (user_id, started_at desc);

-- ───────────────────────── Funzioni ─────────────────────────

-- Punti per minuti consecutivi. Deve restare identica a src/lib/points.ts.
create or replace function public.points_for_minutes(minutes integer)
returns integer language sql immutable as $$
  select floor(
      least(greatest(minutes, 0), 25)
    + least(greatest(minutes - 25, 0), 25) * 1.5
    + greatest(minutes - 50, 0) * 2
  )::integer;
$$;

-- Vero se l'utente corrente condivide almeno un cerchio con `other`.
-- security definer evita la ricorsione delle policy su circle_members.
create or replace function public.shares_circle_with(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select other = auth.uid() or exists (
    select 1
    from circle_members a
    join circle_members b on a.circle_id = b.circle_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

create or replace function public.is_circle_member(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from circle_members where circle_id = c and user_id = auth.uid());
$$;

-- Crea un cerchio e ci aggiunge il creatore.
create or replace function public.create_circle(circle_name text)
returns public.circles language plpgsql security definer set search_path = public as $$
declare
  c circles;
begin
  insert into circles (name, created_by) values (circle_name, auth.uid()) returning * into c;
  insert into circle_members (circle_id, user_id) values (c.id, auth.uid());
  return c;
end;
$$;

-- Entra in un cerchio tramite codice invito.
create or replace function public.join_circle(code text)
returns public.circles language plpgsql security definer set search_path = public as $$
declare
  c circles;
begin
  select * into c from circles where invite_code = upper(trim(code));
  if c.id is null then
    raise exception 'Codice invito non valido';
  end if;
  insert into circle_members (circle_id, user_id) values (c.id, auth.uid())
  on conflict do nothing;
  return c;
end;
$$;

-- Avvia il timer (se ce n'è già uno attivo lo restituisce).
create or replace function public.start_session()
returns public.study_sessions language plpgsql security definer set search_path = public as $$
declare
  s study_sessions;
begin
  select * into s from study_sessions where user_id = auth.uid() and ended_at is null;
  if s.id is null then
    insert into study_sessions (user_id) values (auth.uid()) returning * into s;
  end if;
  return s;
end;
$$;

-- Ferma il timer e calcola i punti lato server, così nessuno può inventarsi i punti.
-- Una sessione dimenticata accesa conta al massimo 4 ore.
create or replace function public.stop_session()
returns public.study_sessions language plpgsql security definer set search_path = public as $$
declare
  s study_sessions;
  ended timestamptz;
  mins integer;
begin
  select * into s from study_sessions where user_id = auth.uid() and ended_at is null;
  if s.id is null then
    return null;
  end if;
  ended := least(now(), s.started_at + interval '4 hours');
  mins := floor(extract(epoch from (ended - s.started_at)) / 60);
  update study_sessions
     set ended_at = ended, points = points_for_minutes(mins)
   where id = s.id
  returning * into s;
  return s;
end;
$$;

-- Crea il profilo alla registrazione, usando lo username passato nei metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── Viste per classifica e grafici ─────────────────────────

-- Punti per persona e per giorno (serve al grafico settimanale e alla serie di giorni).
create view public.daily_points with (security_invoker = true) as
select user_id,
       (started_at at time zone 'Europe/Rome')::date as day,
       sum(points)::integer as points,
       sum(extract(epoch from (ended_at - started_at)) / 60)::integer as minutes
from public.study_sessions
where ended_at is not null
group by user_id, day;

-- ───────────────────────── Sicurezza (RLS) ─────────────────────────

alter table public.profiles       enable row level security;
alter table public.circles        enable row level security;
alter table public.circle_members enable row level security;
alter table public.study_sessions enable row level security;

create policy "profili visibili agli amici" on public.profiles
  for select using (public.shares_circle_with(id));
create policy "modifico solo il mio profilo" on public.profiles
  for update using (id = auth.uid());

create policy "vedo i miei cerchi" on public.circles
  for select using (public.is_circle_member(id));

create policy "vedo i membri dei miei cerchi" on public.circle_members
  for select using (public.is_circle_member(circle_id));
create policy "posso uscire da un cerchio" on public.circle_members
  for delete using (user_id = auth.uid());

-- Le sessioni si creano e chiudono solo con start_session/stop_session.
create policy "sessioni visibili agli amici" on public.study_sessions
  for select using (public.shares_circle_with(user_id));

revoke execute on function public.shares_circle_with(uuid) from public, anon;
revoke execute on function public.is_circle_member(uuid) from public, anon;
revoke execute on function public.create_circle(text) from public, anon;
revoke execute on function public.join_circle(text) from public, anon;
revoke execute on function public.start_session() from public, anon;
revoke execute on function public.stop_session() from public, anon;

-- ───────────────────────── Tempo reale ─────────────────────────

-- Gli amici ricevono subito avvio e stop dei timer.
alter publication supabase_realtime add table public.study_sessions;
