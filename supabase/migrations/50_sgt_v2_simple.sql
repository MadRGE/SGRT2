-- SGT v2: Schema simple para gestor de trámites
-- Ejecutar en Supabase SQL Editor

-- Clientes
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  razon_social text not null,
  cuit text,
  rne text,
  email text,
  telefono text,
  contacto_nombre text,
  origen text default 'directo', -- directo, referido_cliente, referido_despachante
  referido_por text,
  notas text,
  created_at timestamptz default now()
);

-- Tramites
create table if not exists tramites (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  titulo text not null,
  tipo text not null default 'importacion', -- importacion, exportacion
  organismo text, -- ANMAT, INAL, SENASA, CITES, RENPRE, ENACOM, etc.
  descripcion text,
  estado text default 'consulta', -- consulta, presupuestado, en_curso, esperando_cliente, esperando_organismo, observado, aprobado, rechazado, vencido
  prioridad text default 'normal', -- baja, normal, alta, urgente
  fecha_inicio date default current_date,
  fecha_vencimiento date,
  numero_expediente text,
  monto_presupuesto numeric(12,2),
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Seguimientos (historial de cada tramite)
create table if not exists seguimientos (
  id uuid primary key default gen_random_uuid(),
  tramite_id uuid references tramites(id) on delete cascade,
  descripcion text not null,
  created_at timestamptz default now()
);

-- Vencimientos (certificados, registros que vencen)
create table if not exists vencimientos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  tramite_id uuid references tramites(id) on delete set null,
  tipo text not null default 'certificado', -- certificado, registro, habilitacion
  descripcion text not null,
  fecha_vencimiento date not null,
  created_at timestamptz default now()
);

-- Registros y Habilitaciones del cliente (RNE, RNEE, habilitaciones varias)
create table if not exists registros_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  tipo text not null, -- RNE, RNEE, habilitacion_anmat, habilitacion_senasa, habilitacion_inal, habilitacion_enacom, habilitacion_cites, otro
  numero text, -- número del registro/habilitación
  organismo text, -- organismo que lo emitió
  descripcion text, -- descripción o detalle
  fecha_emision date,
  fecha_vencimiento date,
  estado text default 'vigente', -- vigente, en_tramite, vencido, suspendido
  notas text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_tramites_cliente on tramites(cliente_id);
create index if not exists idx_tramites_estado on tramites(estado);
create index if not exists idx_seguimientos_tramite on seguimientos(tramite_id);
create index if not exists idx_vencimientos_fecha on vencimientos(fecha_vencimiento);
create index if not exists idx_registros_cliente on registros_cliente(cliente_id);
create index if not exists idx_registros_tipo on registros_cliente(tipo);

-- RLS policies (acceso abierto por ahora, single user)
alter table clientes enable row level security;
alter table tramites enable row level security;
alter table seguimientos enable row level security;
alter table vencimientos enable row level security;

create policy "Allow all for authenticated" on clientes for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on tramites for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on seguimientos for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on vencimientos for all using (auth.role() = 'authenticated');

alter table registros_cliente enable row level security;
create policy "Allow all for authenticated" on registros_cliente for all using (auth.role() = 'authenticated');
