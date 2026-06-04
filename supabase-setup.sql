-- =============================================================================
-- AsadoPy — Supabase setup
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- =============================================================================

-- 1. Tabla de contactos
create table if not exists public.contacts (
  id            text      primary key,
  user_id       uuid      references auth.users(id) on delete cascade not null,
  name          text      not null,
  sex           text      not null check (sex in ('hombre', 'mujer', 'nino')),
  drinks_alcohol boolean  not null default true,
  alcohol_level  text     not null default 'normal'
                          check (alcohol_level in ('tranquilo', 'normal', 'fuerte')),
  phone         text      not null default '',
  is_favorite   boolean   not null default false,
  created_at    bigint    not null
);

-- 2. Tabla de asados guardados
create table if not exists public.asados (
  id          text    primary key,
  user_id     uuid    references auth.users(id) on delete cascade not null,
  name        text    not null,
  status      text    not null default 'activo'
                      check (status in ('activo', 'finalizado')),
  participants jsonb  not null default '[]',
  config       jsonb  not null,
  created_at  bigint  not null,
  updated_at  bigint  not null,
  finished_at bigint
);

-- 3. Row Level Security
alter table public.contacts enable row level security;
alter table public.asados   enable row level security;

create policy "Usuarios gestionan sus propios contactos"
  on public.contacts for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuarios gestionan sus propios asados"
  on public.asados for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Realtime (para sync entre dispositivos)
alter publication supabase_realtime add table public.contacts;
alter publication supabase_realtime add table public.asados;

-- =============================================================================
-- Listo. Ahora configurar las variables de entorno:
--   NEXT_PUBLIC_SUPABASE_URL  →  Settings → API → Project URL
--   NEXT_PUBLIC_SUPABASE_ANON_KEY  →  Settings → API → anon public
-- =============================================================================
