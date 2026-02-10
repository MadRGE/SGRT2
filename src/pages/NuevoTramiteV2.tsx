import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Loader2, Search, BookOpen, X } from 'lucide-react';

interface Props {
  gestionId?: string;
  clienteId?: string;
  onNavigate: (page: any) => void;
}

interface Cliente {
  id: string;
  razon_social: string;
}

interface Gestion {
  id: string;
  nombre: string;
  cliente_id: string;
  clientes: { razon_social: string } | null;
}

interface TramiteTipo {
  id: string;
  codigo: string;
  nombre: string;
  organismo: string;
  categoria: string | null;
  subcategoria: string | null;
  plataforma: string | null;
  plazo_dias: number | null;
  costo_organismo: number | null;
  honorarios: number | null;
  documentacion_obligatoria: string[] | null;
  observaciones: string | null;
}

const ORGANISMOS_CATALOGO = ['INAL', 'ANMAT', 'SENASA', 'INTI', 'SEDRONAR', 'CITES', 'INASE', 'SIC'];
const PLATAFORMAS = ['TAD', 'TADO', 'VUCE', 'SIGSA', 'Otro'];

export default function NuevoTramiteV2({ gestionId, clienteId, onNavigate }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [catalogo, setCatalogo] = useState<TramiteTipo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrganismo, setSelectedOrganismo] = useState('');
  const [searchCatalogo, setSearchCatalogo] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<TramiteTipo | null>(null);
  const [showCatalogo, setShowCatalogo] = useState(true);
  const [form, setForm] = useState({
    gestion_id: gestionId || '',
    cliente_id: clienteId || '',
    tramite_tipo_id: '',
    titulo: '',
    tipo: 'importacion',
    organismo: '',
    plataforma: '',
    prioridad: 'normal',
    fecha_vencimiento: '',
    monto_presupuesto: '',
    descripcion: '',
  });

  useEffect(() => {
    supabase.from('clientes').select('id, razon_social').order('razon_social')
      .then(({ data }) => { if (data) setClientes(data as Cliente[]); });

    supabase.from('gestiones').select('id, nombre, cliente_id').order('nombre')
      .then(({ data }) => {
        if (data) {
          setGestiones(data.map(g => ({ ...g, clientes: null })) as Gestion[]);
          if (gestionId) {
            const gestion = data.find((g: any) => g.id === gestionId);
            if (gestion) {
              setForm(prev => ({ ...prev, cliente_id: (gestion as any).cliente_id }));
            }
          }
        }
      });

    supabase.from('tramite_tipos').select('*').order('organismo')
      .then(({ data }) => {
        if (data) setCatalogo(data as TramiteTipo[]);
      });
  }, [gestionId]);

  const handleGestionChange = (gestionIdValue: string) => {
    if (gestionIdValue) {
      const gestion = gestiones.find(g => g.id === gestionIdValue);
      setForm(prev => ({
        ...prev,
        gestion_id: gestionIdValue,
        cliente_id: gestion ? gestion.cliente_id : prev.cliente_id,
      }));
    } else {
      setForm(prev => ({ ...prev, gestion_id: '' }));
    }
  };

  const handleSelectTipo = (tipo: TramiteTipo) => {
    setSelectedTipo(tipo);
    const precio = tipo.honorarios || 0;
    setForm(prev => ({
      ...prev,
      tramite_tipo_id: tipo.id,
      titulo: tipo.nombre,
      organismo: tipo.organismo,
      plataforma: tipo.plataforma || prev.plataforma,
      monto_presupuesto: precio > 0 ? precio.toString() : prev.monto_presupuesto,
    }));
    setShowCatalogo(false);
  };

  const handleClearTipo = () => {
    setSelectedTipo(null);
    setForm(prev => ({
      ...prev,
      tramite_tipo_id: '',
      titulo: '',
      organismo: '',
      plataforma: '',
      monto_presupuesto: '',
    }));
    setShowCatalogo(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from('tramites')
      .insert({
        gestion_id: form.gestion_id || null,
        cliente_id: form.cliente_id,
        tramite_tipo_id: form.tramite_tipo_id || null,
        titulo: form.titulo,
        tipo: form.tipo,
        organismo: form.organismo || null,
        plataforma: form.plataforma || null,
        prioridad: form.prioridad,
        fecha_vencimiento: form.fecha_vencimiento || null,
        monto_presupuesto: form.monto_presupuesto ? parseFloat(form.monto_presupuesto) : null,
        descripcion: form.descripcion || null,
        estado: 'consulta',
        semaforo: 'verde',
        progreso: 0,
      })
      .select()
      .single();

    if (!error && data) {
      // If tipo has documentacion_obligatoria, auto-create docs for the tramite
      if (selectedTipo?.documentacion_obligatoria?.length) {
        const docsToInsert = selectedTipo.documentacion_obligatoria.map(docName => ({
          tramite_id: data.id,
          nombre: docName,
          estado: 'pendiente',
          obligatorio: true,
          responsable: 'Cliente',
        }));
        await supabase.from('documentos_tramite').insert(docsToInsert);
      }
      onNavigate({ type: 'tramite', id: data.id });
    }
    setLoading(false);
  };

  const handleBack = () => {
    if (gestionId) {
      onNavigate({ type: 'gestion', id: gestionId });
    } else {
      onNavigate({ type: 'tramites' });
    }
  };

  // Filter catalog by organismo and search
  const filteredCatalogo = catalogo.filter(t => {
    if (selectedOrganismo && t.organismo !== selectedOrganismo) return false;
    if (searchCatalogo) {
      const q = searchCatalogo.toLowerCase();
      return t.nombre.toLowerCase().includes(q) || t.codigo.toLowerCase().includes(q) ||
        (t.categoria || '').toLowerCase().includes(q);
    }
    return true;
  });

  // Group by organismo
  const organismos = [...new Set(filteredCatalogo.map(t => t.organismo))];

  const inputClass = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={handleBack} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      {/* Catalog selector */}
      {showCatalogo && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-slate-800">Catalogo de Tramites</h2>
              <span className="text-xs text-slate-400 ml-auto">{catalogo.length} tipos disponibles</span>
            </div>

            {/* Organismo filter pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                onClick={() => setSelectedOrganismo('')}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  !selectedOrganismo ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                }`}
              >
                Todos
              </button>
              {ORGANISMOS_CATALOGO.map(org => {
                const count = catalogo.filter(t => t.organismo === org).length;
                if (count === 0) return null;
                return (
                  <button
                    key={org}
                    onClick={() => setSelectedOrganismo(org === selectedOrganismo ? '' : org)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      selectedOrganismo === org ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {org} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchCatalogo}
                onChange={e => setSearchCatalogo(e.target.value)}
                placeholder="Buscar por nombre, codigo o categoria..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Catalog list */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100/80">
            {organismos.map(org => (
              <div key={org}>
                <div className="px-4 py-2 bg-slate-50/80 sticky top-0">
                  <span className="text-xs font-semibold text-slate-500 uppercase">{org}</span>
                </div>
                {filteredCatalogo.filter(t => t.organismo === org).map(tipo => (
                  <button
                    key={tipo.id}
                    onClick={() => handleSelectTipo(tipo)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50/50 transition-colors flex items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">{tipo.codigo}</span>
                        {tipo.categoria && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{tipo.categoria}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{tipo.nombre}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {tipo.plataforma && <span className="text-[10px] text-slate-400">{tipo.plataforma}</span>}
                        {tipo.plazo_dias && <span className="text-[10px] text-slate-400">{tipo.plazo_dias} dias</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {tipo.honorarios ? (
                        <span className="text-sm font-semibold text-green-700">
                          ${tipo.honorarios.toLocaleString('es-AR')}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Sin precio</span>
                      )}
                      {tipo.costo_organismo ? (
                        <p className="text-[10px] text-slate-400">Tasa: ${tipo.costo_organismo.toLocaleString('es-AR')}</p>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            ))}
            {filteredCatalogo.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <p className="text-sm">No se encontraron tramites en el catalogo</p>
              </div>
            )}
          </div>

          {/* Skip catalog */}
          <div className="p-3 border-t border-slate-100 text-center">
            <button
              onClick={() => setShowCatalogo(false)}
              className="text-xs text-slate-500 hover:text-blue-600 transition-colors"
            >
              Omitir catalogo y crear tramite manual
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
        <h1 className="text-[26px] tracking-tight font-bold text-slate-800 mb-1">Nuevo Tramite</h1>
        <p className="text-sm text-slate-400 mt-0.5 mb-6">Crea un nuevo tramite de importacion o exportacion</p>

        {/* Selected tipo badge */}
        {selectedTipo && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-800 truncate">{selectedTipo.nombre}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-blue-600">{selectedTipo.organismo}</span>
                <span className="text-xs text-blue-500 font-mono">{selectedTipo.codigo}</span>
                {selectedTipo.plazo_dias && <span className="text-xs text-blue-500">{selectedTipo.plazo_dias} dias</span>}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {selectedTipo.costo_organismo ? (
                <p className="text-xs text-blue-500">Tasa: ${selectedTipo.costo_organismo.toLocaleString('es-AR')}</p>
              ) : null}
            </div>
            <button onClick={handleClearTipo} className="p-1 text-blue-400 hover:text-blue-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Gestion</label>
            <select value={form.gestion_id} onChange={e => handleGestionChange(e.target.value)} className={inputClass}>
              <option value="">Sin gestion asociada</option>
              {gestiones.map(g => (
                <option key={g.id} value={g.id}>
                  {g.nombre}{g.clientes ? ` — ${g.clientes.razon_social}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
            <select required value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })} className={inputClass}>
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Titulo *</label>
            <input required value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej: Registro de producto cosmetico"
              className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className={inputClass}>
                <option value="importacion">Importacion</option>
                <option value="exportacion">Exportacion</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organismo</label>
              <select value={form.organismo} onChange={e => setForm({ ...form, organismo: e.target.value })} className={inputClass}>
                <option value="">Sin definir</option>
                {ORGANISMOS_CATALOGO.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Plataforma</label>
              <select value={form.plataforma} onChange={e => setForm({ ...form, plataforma: e.target.value })} className={inputClass}>
                <option value="">Sin definir</option>
                {PLATAFORMAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
              <select value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })} className={inputClass}>
                <option value="baja">Baja</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Vencimiento</label>
              <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Honorarios Gestion ($)</label>
              <input type="number" value={form.monto_presupuesto} onChange={e => setForm({ ...form, monto_presupuesto: e.target.value })}
                placeholder="0.00"
                className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripcion</label>
            <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={3}
              placeholder="Detalles del tramite..."
              className={inputClass} />
          </div>

          {!showCatalogo && !selectedTipo && (
            <button
              type="button"
              onClick={() => setShowCatalogo(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Seleccionar del catalogo
            </button>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleBack}
              className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Creando...</> : 'Crear Tramite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
