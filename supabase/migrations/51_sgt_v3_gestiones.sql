-- SGT v3: Migración incremental - Gestiones + Documentos + Progreso
-- Ejecutar en Supabase SQL Editor (después de la migración anterior)

-- Gestiones (contenedor de trámites por cliente - equivale a "proyecto")
create table if not exists gestiones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  nombre text not null,
  descripcion text,
  estado text default 'relevamiento', -- relevamiento, en_curso, en_espera, finalizado, archivado
  prioridad text default 'normal', -- baja, normal, alta, urgente
  fecha_inicio date default current_date,
  fecha_cierre date,
  observaciones text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Agregar gestion_id, progreso y semáforo a tramites (si no existen)
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='tramites' and column_name='gestion_id') then
    alter table tramites add column gestion_id uuid references gestiones(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='tramites' and column_name='progreso') then
    alter table tramites add column progreso integer default 0; -- 0-100
  end if;
  if not exists (select 1 from information_schema.columns where table_name='tramites' and column_name='semaforo') then
    alter table tramites add column semaforo text default 'verde'; -- verde, amarillo, rojo
  end if;
  if not exists (select 1 from information_schema.columns where table_name='tramites' and column_name='paso_actual') then
    alter table tramites add column paso_actual integer default 1;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='tramites' and column_name='plataforma') then
    alter table tramites add column plataforma text; -- TAD, TADO, VUCE, SIGSA, etc.
  end if;
end $$;

-- Documentos por trámite (checklist de documentación)
create table if not exists documentos_tramite (
  id uuid primary key default gen_random_uuid(),
  tramite_id uuid references tramites(id) on delete cascade,
  nombre text not null,
  estado text default 'pendiente', -- pendiente, presentado, aprobado, rechazado, vencido
  obligatorio boolean default true,
  responsable text default 'cliente', -- cliente, gestor, organismo
  url_archivo text,
  notas text,
  fecha_presentacion date,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_gestiones_cliente on gestiones(cliente_id);
create index if not exists idx_gestiones_estado on gestiones(estado);
create index if not exists idx_tramites_gestion on tramites(gestion_id);
create index if not exists idx_documentos_tramite on documentos_tramite(tramite_id);

-- RLS
alter table gestiones enable row level security;
alter table documentos_tramite enable row level security;

create policy "Allow all for authenticated" on gestiones for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on documentos_tramite for all using (auth.role() = 'authenticated');
