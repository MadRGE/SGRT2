-- Trigger: enviar email de bienvenida automáticamente al crear un usuario cliente
-- Usa pg_net para llamar a la Edge Function send-welcome-email

-- Habilitar pg_net si no está habilitado
create extension if not exists pg_net with schema extensions;

-- Función que llama a la Edge Function via HTTP
create or replace function public.notify_welcome_email()
returns trigger
language plpgsql
security definer
as $$
declare
  edge_function_url text;
  service_key text;
begin
  -- Solo enviar para usuarios con rol 'cliente'
  if NEW.rol != 'cliente' then
    return NEW;
  end if;

  -- Construir URL de la Edge Function
  edge_function_url := current_setting('app.settings.supabase_url', true)
    || '/functions/v1/send-welcome-email';
  service_key := current_setting('app.settings.service_role_key', true);

  -- Si no hay config, intentar con variables de entorno directas
  if edge_function_url is null or service_key is null then
    return NEW;
  end if;

  -- Llamar a la Edge Function de forma async via pg_net
  perform net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'nombre', NEW.nombre,
        'rol', NEW.rol,
        'cliente_id', NEW.cliente_id
      )
    )
  );

  return NEW;
end;
$$;

-- Trigger en la tabla usuarios
drop trigger if exists on_usuario_created_send_welcome on public.usuarios;
create trigger on_usuario_created_send_welcome
  after insert on public.usuarios
  for each row
  execute function public.notify_welcome_email();

-- También disparar cuando se actualiza el rol a 'cliente' (por si se edita)
create or replace function public.notify_welcome_email_on_update()
returns trigger
language plpgsql
security definer
as $$
declare
  edge_function_url text;
  service_key text;
begin
  -- Solo enviar si el rol cambió a 'cliente' (y antes no era)
  if NEW.rol != 'cliente' or OLD.rol = 'cliente' then
    return NEW;
  end if;

  edge_function_url := current_setting('app.settings.supabase_url', true)
    || '/functions/v1/send-welcome-email';
  service_key := current_setting('app.settings.service_role_key', true);

  if edge_function_url is null or service_key is null then
    return NEW;
  end if;

  perform net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'type', 'UPDATE',
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'nombre', NEW.nombre,
        'rol', NEW.rol,
        'cliente_id', NEW.cliente_id
      )
    )
  );

  return NEW;
end;
$$;

drop trigger if exists on_usuario_updated_send_welcome on public.usuarios;
create trigger on_usuario_updated_send_welcome
  after update on public.usuarios
  for each row
  execute function public.notify_welcome_email_on_update();
