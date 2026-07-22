-- =============================================
-- MOBI GESTIÓN — Schema Supabase
-- Pegar todo esto en SQL Editor y ejecutar
-- =============================================

-- VENDEDORES
create table public.vendedores (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  local text not null,
  roles text[] default '{}',
  notas text default '',
  created_at timestamptz default now()
);

-- PROVEEDORES
create table public.proveedores (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  negocio text not null,
  estado text default 'Activo',
  marcas text default '',
  categorias text default '',
  contacto text default '',
  descuento text default '',
  plazo_pago text default '',
  created_at timestamptz default now()
);

-- TEMAS (historial por local)
create table public.temas (
  id uuid default gen_random_uuid() primary key,
  local text not null,
  titulo text not null,
  fecha date not null,
  notas text default '',
  negocios text[] default '{}',
  tipos text[] default '{}',
  vendedor_nombre text,
  created_at timestamptz default now()
);

-- REUNIONES (vinculadas a proveedores)
create table public.reuniones (
  id uuid default gen_random_uuid() primary key,
  proveedor_id uuid references public.proveedores(id) on delete cascade,
  fecha date not null,
  titulo text not null,
  notas text default '',
  created_at timestamptz default now()
);

-- TAREAS (pueden pertenecer a tema, vendedor, proveedor o reunión)
create table public.tareas (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  prioridad text default 'media',
  fecha_limite date,
  tipo text,
  done boolean default false,
  comentarios jsonb default '[]'::jsonb,
  -- Foreign keys opcionales (solo una activa por tarea)
  tema_id uuid references public.temas(id) on delete cascade,
  vendedor_id uuid references public.vendedores(id) on delete cascade,
  proveedor_id uuid references public.proveedores(id) on delete cascade,
  reunion_id uuid references public.reuniones(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices para performance
create index temas_local_idx on public.temas(local);
create index temas_fecha_idx on public.temas(fecha desc);
create index tareas_tema_id_idx on public.tareas(tema_id);
create index tareas_vendedor_id_idx on public.tareas(vendedor_id);
create index tareas_proveedor_id_idx on public.tareas(proveedor_id);
create index tareas_done_idx on public.tareas(done);
create index reuniones_proveedor_idx on public.reuniones(proveedor_id);

-- Trigger updated_at en tareas
create or replace function public.handle_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger tareas_updated_at
  before update on public.tareas
  for each row execute procedure public.handle_updated_at();

-- Row Level Security (todos los usuarios autenticados ven todo)
alter table public.vendedores enable row level security;
alter table public.proveedores enable row level security;
alter table public.temas enable row level security;
alter table public.reuniones enable row level security;
alter table public.tareas enable row level security;

create policy "auth_all_vendedores" on public.vendedores for all to authenticated using (true) with check (true);
create policy "auth_all_proveedores" on public.proveedores for all to authenticated using (true) with check (true);
create policy "auth_all_temas" on public.temas for all to authenticated using (true) with check (true);
create policy "auth_all_reuniones" on public.reuniones for all to authenticated using (true) with check (true);
create policy "auth_all_tareas" on public.tareas for all to authenticated using (true) with check (true);
