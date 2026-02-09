-- SGT v4: Documentos a nivel cliente (repositorio reutilizable)
-- Ejecutar en Supabase SQL Editor (después de la migración 51)

-- Repositorio de documentos del cliente (CUIT, Estatuto, Poder, etc.)
-- Se suben una vez y se reutilizan en múltiples trámites
create table if not exists documentos_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  nombre text not null, -- Ej: "Constancia de CUIT", "Estatuto Social"
  categoria text default 'general', -- general, societario, fiscal, comercio_exterior, tecnico
  estado text default 'vigente', -- vigente, vencido, pendiente
  fecha_emision date,
  fecha_vencimiento date,
  url_archivo text,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Agregar referencia opcional a documento del cliente en documentos_tramite
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='documentos_tramite' and column_name='documento_cliente_id') then
    alter table documentos_tramite add column documento_cliente_id uuid references documentos_cliente(id) on delete set null;
  end if;
end $$;

-- Indexes
create index if not exists idx_documentos_cliente_cliente on documentos_cliente(cliente_id);
create index if not exists idx_documentos_cliente_categoria on documentos_cliente(categoria);
create index if not exists idx_documentos_tramite_doc_cliente on documentos_tramite(documento_cliente_id);

-- RLS
alter table documentos_cliente enable row level security;
create policy "Allow all for authenticated" on documentos_cliente for all using (auth.role() = 'authenticated');
