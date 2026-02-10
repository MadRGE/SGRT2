-- SGT v6: Sistema de precios con 3 bandas + listas especiales por cliente
-- Ejecutar en Supabase SQL Editor (después de la migración 53)

-- Agregar bandas de precio a tramite_tipos
-- banda1: estándar (trámite suelto / cliente nuevo)
-- banda2: paquete (gestión con múltiples trámites)
-- banda3: VIP (cliente frecuente / contrato anual)
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='tramite_tipos' and column_name='precio_banda_1') then
    alter table tramite_tipos add column precio_banda_1 numeric(12,2) default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='tramite_tipos' and column_name='precio_banda_2') then
    alter table tramite_tipos add column precio_banda_2 numeric(12,2) default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='tramite_tipos' and column_name='precio_banda_3') then
    alter table tramite_tipos add column precio_banda_3 numeric(12,2) default 0;
  end if;
end $$;

-- Copiar honorarios actuales a banda_1 como punto de partida
update tramite_tipos set precio_banda_1 = honorarios where precio_banda_1 = 0 and honorarios > 0;

-- Listas de precios especiales por cliente
-- Un cliente puede tener una lista asignada que sobreescribe los precios del catálogo
create table if not exists listas_precios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, -- "MercadoLibre 2025", "Paquete Anual ACME"
  descripcion text,
  banda_default integer default 1, -- 1, 2, o 3: qué banda aplica por defecto
  descuento_global numeric(5,2) default 0, -- % descuento sobre la banda
  activa boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Precios específicos dentro de una lista (sobreescribe precio de catálogo)
create table if not exists lista_precio_items (
  id uuid primary key default gen_random_uuid(),
  lista_id uuid references listas_precios(id) on delete cascade,
  tramite_tipo_id uuid references tramite_tipos(id) on delete cascade,
  precio_custom numeric(12,2) not null, -- precio específico para este trámite en esta lista
  notas text,
  created_at timestamptz default now(),
  unique(lista_id, tramite_tipo_id)
);

-- Agregar lista_precio_id a clientes (qué lista de precios aplica)
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='clientes' and column_name='lista_precio_id') then
    alter table clientes add column lista_precio_id uuid references listas_precios(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='clientes' and column_name='banda_precio') then
    alter table clientes add column banda_precio integer default 1; -- 1, 2 o 3
  end if;
end $$;

-- Indexes
create index if not exists idx_listas_precios_activa on listas_precios(activa);
create index if not exists idx_lista_items_lista on lista_precio_items(lista_id);
create index if not exists idx_lista_items_tipo on lista_precio_items(tramite_tipo_id);
create index if not exists idx_clientes_lista on clientes(lista_precio_id);

-- RLS
alter table listas_precios enable row level security;
alter table lista_precio_items enable row level security;
create policy "Allow all for authenticated" on listas_precios for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on lista_precio_items for all using (auth.role() = 'authenticated');
