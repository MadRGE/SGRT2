import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { getApiKey, setApiKey } from '../lib/apiKeys';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Edit,
  CheckSquare,
  List as ListIcon,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  RefreshCw,
  Copy,
  Power,
  Phone,
  Shield
} from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface TramiteTipo {
  id: string;
  codigo: string;
  nombre: string;
  organismo_id: string;
  rubro: string;
  base_legal: string[];
  renovacion: string;
  sla_total_dias: number;
  admite_equivalencia: boolean;
  logica_especial: string | null;
  es_habilitacion_previa: boolean;
}

interface Organismo {
  id: string;
  sigla: string;
  nombre: string;
}

interface ChecklistItem {
  id: string;
  item: string;
  obligatorio: boolean;
  responsable: string;
  grupo: string | null;
}

interface Paso {
  id: string;
  orden: number;
  nombre: string;
  descripcion: string;
}

export default function Configuracion({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'tramites' | 'apikeys' | 'whatsapp'>('tramites');
  const [tramites, setTramites] = useState<TramiteTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTramite, setEditingTramite] = useState<string | null>(null);

  useEffect(() => {
    loadTramites();
  }, []);

  const loadTramites = async () => {
    setLoading(true);
    const { data } = await supabase.from('tramite_tipos').select('*').order('nombre');
    if (data) setTramites(data);
    setLoading(false);
  };

  if (editingTramite) {
    return (
      <EditarTramite
        tramiteId={editingTramite}
        onBack={() => {
          setEditingTramite(null);
          loadTramites();
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver al Dashboard
      </button>

      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('tramites')}
            className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'tramites'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <ListIcon className="w-4 h-4" />
            Trámites
          </button>
          <button
            onClick={() => setActiveTab('apikeys')}
            className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'apikeys'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'whatsapp'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp
          </button>
        </div>
      </div>

      {activeTab === 'apikeys' && <ApiKeysSection />}

      {activeTab === 'tramites' && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Gestión de Trámites</h1>
              <p className="text-slate-600 mt-1">Configuración del catálogo de trámites del sistema</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium text-slate-700">Código</th>
                    <th className="p-3 text-left text-sm font-medium text-slate-700">Nombre</th>
                    <th className="p-3 text-left text-sm font-medium text-slate-700">Rubro</th>
                    <th className="p-3 text-center text-sm font-medium text-slate-700">SLA</th>
                    <th className="p-3 text-center text-sm font-medium text-slate-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tramites.map((tramite) => (
                    <tr key={tramite.id} className="border-t border-slate-200 hover:bg-slate-50">
                      <td className="p-3 text-sm font-mono text-slate-700">{tramite.codigo}</td>
                      <td className="p-3 text-sm text-slate-800">{tramite.nombre}</td>
                      <td className="p-3 text-sm text-slate-600">{tramite.rubro}</td>
                      <td className="p-3 text-sm text-slate-600 text-center">
                        {tramite.sla_total_dias}d
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setEditingTramite(tramite.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'whatsapp' && <WhatsAppConfigSection />}
    </div>
  );
}

// ─── WhatsApp Configuration Section ─────────────────────────────────────────

interface WaConfig {
  id?: string;
  app_id: string;
  app_secret: string;
  phone_number_id: string;
  access_token: string;
  verify_token: string;
  waba_id: string;
  bot_enabled: boolean;
}

interface WaNumber {
  id: string;
  phone_number: string;
  display_name: string | null;
  usuario_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface WaMessage {
  id: string;
  phone_number: string;
  direction: string;
  message_text: string | null;
  ai_action: Record<string, unknown> | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
}

function WhatsAppConfigSection() {
  const [activeSection, setActiveSection] = useState<'config' | 'numbers' | 'log'>('config');
  const [config, setConfig] = useState<WaConfig>({
    app_id: '',
    app_secret: '',
    phone_number_id: '',
    access_token: '',
    verify_token: '',
    waba_id: '',
    bot_enabled: false,
  });
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaved, setConfigSaved] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Numbers state
  const [numbers, setNumbers] = useState<WaNumber[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newUsuarioId, setNewUsuarioId] = useState('');

  // Log state
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'error' | 'rejected'>('all');
  const [logPage, setLogPage] = useState(0);
  const LOG_PAGE_SIZE = 20;

  useEffect(() => {
    loadConfig();
    loadNumbers();
    loadUsuarios();
  }, []);

  useEffect(() => {
    if (activeSection === 'log') {
      loadMessages();
      const interval = setInterval(loadMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [activeSection, logFilter, statusFilter, logPage]);

  const loadConfig = async () => {
    setConfigLoading(true);
    const { data } = await supabase.from('whatsapp_config').select('*').limit(1).single();
    if (data) {
      setConfig(data);
    }
    setConfigLoading(false);
  };

  const loadNumbers = async () => {
    const { data } = await supabase
      .from('whatsapp_authorized_numbers')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setNumbers(data);
  };

  const loadUsuarios = async () => {
    const { data } = await supabase.from('usuarios').select('id, nombre, email').order('nombre');
    if (data) setUsuarios(data);
  };

  const loadMessages = async () => {
    let query = supabase
      .from('whatsapp_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .range(logPage * LOG_PAGE_SIZE, (logPage + 1) * LOG_PAGE_SIZE - 1);

    if (logFilter !== 'all') query = query.eq('direction', logFilter);
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);

    const { data } = await query;
    if (data) setMessages(data);
  };

  const handleSaveConfig = async () => {
    const payload = { ...config, updated_at: new Date().toISOString() };
    if (config.id) {
      await supabase.from('whatsapp_config').update(payload).eq('id', config.id);
    } else {
      const { data } = await supabase.from('whatsapp_config').insert(payload).select().single();
      if (data) setConfig(data);
    }
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const generateVerifyToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
    setConfig((prev) => ({ ...prev, verify_token: token }));
  };

  const handleAddNumber = async () => {
    if (!newPhone) return;
    const { error } = await supabase.from('whatsapp_authorized_numbers').insert({
      phone_number: newPhone,
      display_name: newName || null,
      usuario_id: newUsuarioId || null,
    });
    if (!error) {
      setNewPhone('');
      setNewName('');
      setNewUsuarioId('');
      loadNumbers();
    }
  };

  const handleToggleNumber = async (id: string, currentActive: boolean) => {
    await supabase.from('whatsapp_authorized_numbers').update({ is_active: !currentActive }).eq('id', id);
    loadNumbers();
  };

  const handleDeleteNumber = async (id: string) => {
    await supabase.from('whatsapp_authorized_numbers').delete().eq('id', id);
    loadNumbers();
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL || 'https://[TU-PROYECTO].supabase.co'}/functions/v1/whatsapp-webhook`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section tabs */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-green-600" />
              WhatsApp Bot
            </h1>
            <p className="text-slate-600 mt-1">Agente IA para carga rápida de datos por WhatsApp</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${config.bot_enabled ? 'text-green-600' : 'text-slate-400'}`}>
              {config.bot_enabled ? 'Bot Activo' : 'Bot Inactivo'}
            </span>
            <button
              onClick={() => setConfig((prev) => ({ ...prev, bot_enabled: !prev.bot_enabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.bot_enabled ? 'bg-green-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.bot_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="border-b border-slate-200 mb-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveSection('config')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 ${
                activeSection === 'config'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              Credenciales Meta
            </button>
            <button
              onClick={() => setActiveSection('numbers')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 ${
                activeSection === 'numbers'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Phone className="w-4 h-4" />
              Números Autorizados ({numbers.length})
            </button>
            <button
              onClick={() => setActiveSection('log')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 ${
                activeSection === 'log'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <ListIcon className="w-4 h-4" />
              Log de Mensajes
            </button>
          </div>
        </div>

        {/* ── Section A: Credenciales Meta ── */}
        {activeSection === 'config' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">App ID</label>
                <input
                  type="text"
                  value={config.app_id}
                  onChange={(e) => setConfig((p) => ({ ...p, app_id: e.target.value }))}
                  placeholder="123456789012345"
                  className="w-full p-2 border border-slate-300 rounded-md font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">App Secret</label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={config.app_secret}
                    onChange={(e) => setConfig((p) => ({ ...p, app_secret: e.target.value }))}
                    placeholder="abc123..."
                    className="w-full p-2 pr-10 border border-slate-300 rounded-md font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Phone Number ID</label>
                <input
                  type="text"
                  value={config.phone_number_id}
                  onChange={(e) => setConfig((p) => ({ ...p, phone_number_id: e.target.value }))}
                  placeholder="109876543210987"
                  className="w-full p-2 border border-slate-300 rounded-md font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Access Token</label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={config.access_token}
                    onChange={(e) => setConfig((p) => ({ ...p, access_token: e.target.value }))}
                    placeholder="EAAx..."
                    className="w-full p-2 pr-10 border border-slate-300 rounded-md font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Verify Token</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.verify_token}
                    onChange={(e) => setConfig((p) => ({ ...p, verify_token: e.target.value }))}
                    placeholder="mi_token_secreto"
                    className="flex-1 p-2 border border-slate-300 rounded-md font-mono text-sm"
                  />
                  <button
                    onClick={generateVerifyToken}
                    className="px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50"
                    title="Generar token aleatorio"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">WABA ID (opcional)</label>
                <input
                  type="text"
                  value={config.waba_id}
                  onChange={(e) => setConfig((p) => ({ ...p, waba_id: e.target.value }))}
                  placeholder="WhatsApp Business Account ID"
                  className="w-full p-2 border border-slate-300 rounded-md font-mono text-sm"
                />
              </div>
            </div>

            {/* Webhook URL */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Webhook URL (copiar a Meta Dashboard)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={webhookUrl}
                  readOnly
                  className="flex-1 p-2 border border-slate-200 rounded-md font-mono text-sm bg-slate-50 text-slate-600"
                />
                <button
                  onClick={() => copyToClipboard(webhookUrl)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSaveConfig}
                className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Save className="w-5 h-5" />
                Guardar Configuración
              </button>
              {configSaved && (
                <span className="text-green-600 text-sm flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Configuración guardada
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Section B: Números Autorizados ── */}
        {activeSection === 'numbers' && (
          <div className="space-y-6">
            {/* Add number form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Teléfono (E.164)</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+5491112345678"
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Nombre</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Usuario vinculado</label>
                <select
                  value={newUsuarioId}
                  onChange={(e) => setNewUsuarioId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm bg-white"
                >
                  <option value="">Sin vincular</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddNumber}
                  disabled={!newPhone}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>
            </div>

            {/* Numbers table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium text-slate-700">Número</th>
                    <th className="p-3 text-left text-sm font-medium text-slate-700">Nombre</th>
                    <th className="p-3 text-left text-sm font-medium text-slate-700">Usuario</th>
                    <th className="p-3 text-center text-sm font-medium text-slate-700">Activo</th>
                    <th className="p-3 text-center text-sm font-medium text-slate-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {numbers.map((num) => {
                    const linkedUser = usuarios.find((u) => u.id === num.usuario_id);
                    return (
                      <tr key={num.id} className="border-t border-slate-200 hover:bg-slate-50">
                        <td className="p-3 text-sm font-mono text-slate-700">{num.phone_number}</td>
                        <td className="p-3 text-sm text-slate-800">{num.display_name || '-'}</td>
                        <td className="p-3 text-sm text-slate-600">
                          {linkedUser ? `${linkedUser.nombre}` : '-'}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleToggleNumber(num.id, num.is_active)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                              num.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            {num.is_active ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteNumber(num.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {numbers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        No hay números autorizados. Agregá uno arriba.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Section C: Log de Mensajes ── */}
        {activeSection === 'log' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 items-center">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Dirección</label>
                <select
                  value={logFilter}
                  onChange={(e) => { setLogFilter(e.target.value as typeof logFilter); setLogPage(0); }}
                  className="p-2 border border-slate-300 rounded-md text-sm bg-white"
                >
                  <option value="all">Todos</option>
                  <option value="inbound">Entrantes</option>
                  <option value="outbound">Salientes</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Estado</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setLogPage(0); }}
                  className="p-2 border border-slate-300 rounded-md text-sm bg-white"
                >
                  <option value="all">Todos</option>
                  <option value="sent">Enviado</option>
                  <option value="error">Error</option>
                  <option value="rejected">Rechazado</option>
                </select>
              </div>
              <div className="flex items-end ml-auto">
                <button
                  onClick={loadMessages}
                  className="flex items-center gap-1 px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualizar
                </button>
              </div>
            </div>

            {/* Messages table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 text-left font-medium text-slate-700">Hora</th>
                    <th className="p-3 text-left font-medium text-slate-700">Teléfono</th>
                    <th className="p-3 text-center font-medium text-slate-700">Dir</th>
                    <th className="p-3 text-left font-medium text-slate-700">Mensaje</th>
                    <th className="p-3 text-left font-medium text-slate-700">Acción IA</th>
                    <th className="p-3 text-center font-medium text-slate-700">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => (
                    <tr key={msg.id} className="border-t border-slate-200 hover:bg-slate-50">
                      <td className="p-3 text-slate-600 whitespace-nowrap">
                        {new Date(msg.created_at).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3 font-mono text-slate-700">{msg.phone_number}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            msg.direction === 'inbound'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {msg.direction === 'inbound' ? 'IN' : 'OUT'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-800 max-w-xs truncate" title={msg.message_text || ''}>
                        {msg.message_text || '-'}
                      </td>
                      <td className="p-3 text-slate-600 max-w-[120px] truncate">
                        {msg.ai_action ? (msg.ai_action as Record<string, unknown>).action as string || '-' : '-'}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            msg.status === 'sent'
                              ? 'bg-green-100 text-green-700'
                              : msg.status === 'error' || msg.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {msg.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {messages.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No hay mensajes registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setLogPage((p) => Math.max(0, p - 1))}
                disabled={logPage === 0}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-600">Página {logPage + 1}</span>
              <button
                onClick={() => setLogPage((p) => p + 1)}
                disabled={messages.length < LOG_PAGE_SIZE}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ApiKeysSection() {
  const [geminiKey, setGeminiKey] = useState(() => getApiKey('GEMINI'));
  const [anthropicKey, setAnthropicKey] = useState(() => getApiKey('ANTHROPIC'));
  const [showGemini, setShowGemini] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, 'loading' | 'ok' | 'error'>>({});

  const handleSave = () => {
    setApiKey('GEMINI', geminiKey);
    setApiKey('ANTHROPIC', anthropicKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const testGemini = async () => {
    if (!geminiKey) return;
    setTestResults((prev) => ({ ...prev, gemini: 'loading' }));
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`
      );
      setTestResults((prev) => ({ ...prev, gemini: res.ok ? 'ok' : 'error' }));
    } catch {
      setTestResults((prev) => ({ ...prev, gemini: 'error' }));
    }
  };

  const [anthropicError, setAnthropicError] = useState('');

  const testAnthropic = async () => {
    if (!anthropicKey) return;
    setTestResults((prev) => ({ ...prev, anthropic: 'loading' }));
    setAnthropicError('');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        setAnthropicError(`${res.status}: ${errBody}`);
      }
      setTestResults((prev) => ({ ...prev, anthropic: res.ok ? 'ok' : 'error' }));
    } catch (e: any) {
      setAnthropicError(e.message || 'Error de red');
      setTestResults((prev) => ({ ...prev, anthropic: 'error' }));
    }
  };

  const renderTestStatus = (key: string) => {
    const status = testResults[key];
    if (!status) return null;
    if (status === 'loading') return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    if (status === 'ok') return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">API Keys</h1>
        <p className="text-slate-600 mt-1">
          Configurá las claves de API para los servicios de inteligencia artificial.
          Las claves se guardan en tu navegador.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Google Gemini (Análisis de imágenes)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showGemini ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full p-2 pr-10 border border-slate-300 rounded-md font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowGemini(!showGemini)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={testGemini}
              disabled={!geminiKey || testResults.gemini === 'loading'}
              className="px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
            >
              Probar
              {renderTestStatus('gemini')}
            </button>
          </div>
          {testResults.gemini === 'ok' && (
            <p className="text-green-600 text-xs mt-1">Conexión exitosa</p>
          )}
          {testResults.gemini === 'error' && (
            <p className="text-red-600 text-xs mt-1">Key inválida o sin permisos</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Anthropic / Claude (Asistente IA y documentos ANMAT)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showAnthropic ? 'text' : 'password'}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full p-2 pr-10 border border-slate-300 rounded-md font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowAnthropic(!showAnthropic)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showAnthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={testAnthropic}
              disabled={!anthropicKey || testResults.anthropic === 'loading'}
              className="px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
            >
              Probar
              {renderTestStatus('anthropic')}
            </button>
          </div>
          {testResults.anthropic === 'ok' && (
            <p className="text-green-600 text-xs mt-1">Conexión exitosa</p>
          )}
          {testResults.anthropic === 'error' && (
            <p className="text-red-600 text-xs mt-1">{anthropicError || 'Key inválida o sin permisos'}</p>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Save className="w-5 h-5" />
          Guardar
        </button>
        {saved && (
          <span className="text-green-600 text-sm flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Claves guardadas
          </span>
        )}
      </div>
    </div>
  );
}

function EditarTramite({ tramiteId, onBack }: { tramiteId: string; onBack: () => void }) {
  const [tramite, setTramite] = useState<TramiteTipo | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [pasos, setPasos] = useState<Paso[]>([]);
  const [organismos, setOrganismos] = useState<Organismo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'datos' | 'checklist' | 'pasos'>('datos');

  useEffect(() => {
    loadData();
  }, [tramiteId]);

  const loadData = async () => {
    setLoading(true);

    const [tramiteRes, checklistRes, pasosRes, organismosRes] = await Promise.all([
      supabase.from('tramite_tipos').select('*').eq('id', tramiteId).single(),
      supabase.from('tramite_checklists').select('*').eq('tramite_tipo_id', tramiteId).order('grupo'),
      supabase.from('procedure_stages').select('*').eq('tramite_tipo_id', tramiteId).order('orden'),
      supabase.from('organismos').select('*').order('sigla')
    ]);

    if (tramiteRes.data) setTramite(tramiteRes.data);
    if (checklistRes.data) setChecklist(checklistRes.data);
    if (pasosRes.data) setPasos(pasosRes.data);
    if (organismosRes.data) setOrganismos(organismosRes.data);

    setLoading(false);
  };

  const handleSaveAll = async () => {
    if (!tramite) return;
    setSaving(true);

    await supabase.from('tramite_tipos').update(tramite).eq('id', tramiteId);

    const existingChecklistIds = checklist.filter((c) => !c.id.startsWith('new-')).map((c) => c.id);
    const newChecklistItems = checklist.filter((c) => c.id.startsWith('new-'));
    const { data: currentChecklist } = await supabase
      .from('tramite_checklists')
      .select('id')
      .eq('tramite_tipo_id', tramiteId);
    const toDelete = currentChecklist?.filter((c) => !existingChecklistIds.includes(c.id)) || [];

    if (toDelete.length > 0) {
      await supabase
        .from('tramite_checklists')
        .delete()
        .in(
          'id',
          toDelete.map((c) => c.id)
        );
    }

    for (const item of checklist.filter((c) => !c.id.startsWith('new-'))) {
      await supabase
        .from('tramite_checklists')
        .update({
          item: item.item,
          obligatorio: item.obligatorio,
          responsable: item.responsable,
          grupo: item.grupo
        })
        .eq('id', item.id);
    }

    if (newChecklistItems.length > 0) {
      await supabase.from('tramite_checklists').insert(
        newChecklistItems.map((item) => ({
          tramite_tipo_id: tramiteId,
          item: item.item,
          obligatorio: item.obligatorio,
          responsable: item.responsable,
          grupo: item.grupo
        }))
      );
    }

    const existingPasoIds = pasos.filter((p) => !p.id.startsWith('new-')).map((p) => p.id);
    const newPasos = pasos.filter((p) => p.id.startsWith('new-'));
    const { data: currentPasos } = await supabase
      .from('procedure_stages')
      .select('id')
      .eq('tramite_tipo_id', tramiteId);
    const pasosToDelete = currentPasos?.filter((p) => !existingPasoIds.includes(p.id)) || [];

    if (pasosToDelete.length > 0) {
      await supabase
        .from('procedure_stages')
        .delete()
        .in(
          'id',
          pasosToDelete.map((p) => p.id)
        );
    }

    for (const paso of pasos.filter((p) => !p.id.startsWith('new-'))) {
      await supabase
        .from('procedure_stages')
        .update({
          orden: paso.orden,
          nombre: paso.nombre,
          descripcion: paso.descripcion
        })
        .eq('id', paso.id);
    }

    if (newPasos.length > 0) {
      await supabase.from('procedure_stages').insert(
        newPasos.map((paso) => ({
          tramite_tipo_id: tramiteId,
          orden: paso.orden,
          nombre: paso.nombre,
          descripcion: paso.descripcion
        }))
      );
    }

    setSaving(false);
    toast.success('Cambios guardados correctamente');
  };

  const handleTramiteChange = (field: keyof TramiteTipo, value: any) => {
    setTramite((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleChecklistUpdate = (id: string, field: keyof ChecklistItem, value: any) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleAddChecklist = () => {
    setChecklist((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        item: 'Nuevo Requisito',
        obligatorio: true,
        responsable: 'cliente',
        grupo: 'Documentación General'
      }
    ]);
  };

  const handleDeleteChecklist = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePasoUpdate = (id: string, field: keyof Paso, value: any) => {
    setPasos((prev) => prev.map((paso) => (paso.id === id ? { ...paso, [field]: value } : paso)));
  };

  const handleAddPaso = () => {
    const maxOrden = Math.max(0, ...pasos.map((p) => p.orden));
    setPasos((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        orden: maxOrden + 1,
        nombre: 'Nuevo Paso',
        descripcion: 'gestor'
      }
    ]);
  };

  const handleDeletePaso = (id: string) => {
    setPasos((prev) => prev.filter((paso) => paso.id !== id));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!tramite) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <p className="text-center text-slate-500">Trámite no encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver a Lista de Trámites
      </button>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Editor de Trámites</h1>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center justify-center bg-green-600 text-white px-5 py-2 rounded-lg shadow-sm hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        <div className="border-b border-slate-200 mb-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveSection('datos')}
              className={`pb-3 px-2 font-medium transition-colors ${
                activeSection === 'datos'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Datos Principales
            </button>
            <button
              onClick={() => setActiveSection('checklist')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 ${
                activeSection === 'checklist'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              Checklist ({checklist.length})
            </button>
            <button
              onClick={() => setActiveSection('pasos')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 ${
                activeSection === 'pasos'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <ListIcon className="w-4 h-4" />
              Pasos ({pasos.length})
            </button>
          </div>
        </div>

        {activeSection === 'datos' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Nombre del Trámite
                </label>
                <input
                  type="text"
                  value={tramite.nombre}
                  onChange={(e) => handleTramiteChange('nombre', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Código</label>
                <input
                  type="text"
                  value={tramite.codigo}
                  onChange={(e) => handleTramiteChange('codigo', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Organismo</label>
                <select
                  value={tramite.organismo_id}
                  onChange={(e) => handleTramiteChange('organismo_id', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md bg-white"
                >
                  {organismos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.sigla}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Rubro</label>
                <input
                  type="text"
                  value={tramite.rubro || ''}
                  onChange={(e) => handleTramiteChange('rubro', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  SLA (Días)
                </label>
                <input
                  type="number"
                  value={tramite.sla_total_dias}
                  onChange={(e) => handleTramiteChange('sla_total_dias', parseInt(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Renovación</label>
                <input
                  type="text"
                  value={tramite.renovacion || ''}
                  onChange={(e) => handleTramiteChange('renovacion', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Base Legal (separada por comas)
                </label>
                <input
                  type="text"
                  value={tramite.base_legal?.join(', ') || ''}
                  onChange={(e) =>
                    handleTramiteChange(
                      'base_legal',
                      e.target.value.split(',').map((s) => s.trim())
                    )
                  }
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <div className="col-span-3">
                <h4 className="font-medium text-slate-800 mb-3">Lógica del Sistema</h4>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={tramite.es_habilitacion_previa}
                      onChange={(e) => handleTramiteChange('es_habilitacion_previa', e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium">Es Habilitación Previa (Blocker)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={tramite.admite_equivalencia}
                      onChange={(e) => handleTramiteChange('admite_equivalencia', e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium">Admite Equivalencia</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Lógica Especial (UI):</label>
                    <input
                      type="text"
                      value={tramite.logica_especial || ''}
                      placeholder="Ej: CITES, RENPRE"
                      onChange={(e) =>
                        handleTramiteChange('logica_especial', e.target.value || null)
                      }
                      className="p-2 border border-slate-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'checklist' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                Editor de Checklist de Documentos
              </h3>
              <button
                onClick={handleAddChecklist}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Añadir Ítem
              </button>
            </div>
            <div className="space-y-3">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 p-3 border border-slate-200 rounded-md bg-slate-50"
                >
                  <div className="col-span-5">
                    <label className="text-xs font-medium text-slate-700 block mb-1">Item</label>
                    <input
                      type="text"
                      value={item.item}
                      onChange={(e) => handleChecklistUpdate(item.id, 'item', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs font-medium text-slate-700 block mb-1">Grupo</label>
                    <input
                      type="text"
                      value={item.grupo || ''}
                      onChange={(e) => handleChecklistUpdate(item.id, 'grupo', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Responsable
                    </label>
                    <select
                      value={item.responsable}
                      onChange={(e) => handleChecklistUpdate(item.id, 'responsable', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-md text-sm bg-white"
                    >
                      <option value="cliente">Cliente</option>
                      <option value="gestor">Gestor</option>
                      <option value="tercero">Tercero</option>
                    </select>
                  </div>
                  <div className="col-span-1 flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.obligatorio}
                        onChange={(e) =>
                          handleChecklistUpdate(item.id, 'obligatorio', e.target.checked)
                        }
                        className="h-4 w-4"
                      />
                      <span className="text-xs ml-1">Oblig.</span>
                    </label>
                  </div>
                  <div className="col-span-1 flex items-end">
                    <button
                      onClick={() => handleDeleteChecklist(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'pasos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                Editor de Pasos del Proceso (Flujo)
              </h3>
              <button
                onClick={handleAddPaso}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Añadir Paso
              </button>
            </div>
            <div className="space-y-3">
              {pasos
                .sort((a, b) => a.orden - b.orden)
                .map((paso) => (
                  <div
                    key={paso.id}
                    className="grid grid-cols-12 gap-2 p-3 border border-slate-200 rounded-md bg-slate-50"
                  >
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-slate-700 block mb-1">Orden</label>
                      <input
                        type="number"
                        value={paso.orden}
                        onChange={(e) => handlePasoUpdate(paso.id, 'orden', parseInt(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-md text-sm"
                      />
                    </div>
                    <div className="col-span-6">
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Nombre del Paso
                      </label>
                      <input
                        type="text"
                        value={paso.nombre}
                        onChange={(e) => handlePasoUpdate(paso.id, 'nombre', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Rol Responsable
                      </label>
                      <select
                        value={paso.descripcion}
                        onChange={(e) =>
                          handlePasoUpdate(paso.id, 'descripcion', e.target.value)
                        }
                        className="w-full p-2 border border-slate-300 rounded-md text-sm bg-white"
                      >
                        <option value="gestor">Gestor (Interno)</option>
                        <option value="cliente">Cliente</option>
                        <option value="tercero">Tercero (Laboratorio, etc)</option>
                        <option value="sistema">Sistema (Automático)</option>
                      </select>
                    </div>
                    <div className="col-span-1 flex items-end">
                      <button
                        onClick={() => handleDeletePaso(paso.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
