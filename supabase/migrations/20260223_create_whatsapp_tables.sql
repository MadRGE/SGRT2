-- ============================================================================
-- WhatsApp Bot Integration Tables
-- Tablas para el agente IA por WhatsApp: config, números autorizados, mensajes
-- ============================================================================

-- 1. whatsapp_config: Configuración global del bot (una sola fila)
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id text,
  app_secret text,
  phone_number_id text,
  access_token text,
  verify_token text,
  waba_id text,
  bot_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: solo usuarios autenticados
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_config_select_authenticated"
  ON whatsapp_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "whatsapp_config_insert_authenticated"
  ON whatsapp_config FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "whatsapp_config_update_authenticated"
  ON whatsapp_config FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permitir lectura desde service_role (edge functions)
CREATE POLICY "whatsapp_config_select_service"
  ON whatsapp_config FOR SELECT
  TO service_role
  USING (true);

-- 2. whatsapp_authorized_numbers: Números habilitados para usar el bot
CREATE TABLE IF NOT EXISTS whatsapp_authorized_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL UNIQUE,
  display_name text,
  usuario_id uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_authorized_phone ON whatsapp_authorized_numbers(phone_number);

-- RLS: usuarios autenticados pueden gestionar
ALTER TABLE whatsapp_authorized_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_numbers_select_authenticated"
  ON whatsapp_authorized_numbers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "whatsapp_numbers_insert_authenticated"
  ON whatsapp_authorized_numbers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "whatsapp_numbers_update_authenticated"
  ON whatsapp_authorized_numbers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "whatsapp_numbers_delete_authenticated"
  ON whatsapp_authorized_numbers FOR DELETE
  TO authenticated
  USING (true);

-- Service role access (edge functions)
CREATE POLICY "whatsapp_numbers_select_service"
  ON whatsapp_authorized_numbers FOR SELECT
  TO service_role
  USING (true);

-- 3. whatsapp_messages: Log de mensajes entrantes y salientes
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_message_id text,
  phone_number text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_text text,
  message_type text DEFAULT 'text',
  ai_action jsonb,
  ai_response_text text,
  pending_action jsonb,
  status text NOT NULL DEFAULT 'received',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_messages_phone ON whatsapp_messages(phone_number);
CREATE INDEX idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);

-- RLS: autenticados pueden leer, service_role puede insertar/actualizar
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_messages_select_authenticated"
  ON whatsapp_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "whatsapp_messages_all_service"
  ON whatsapp_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
