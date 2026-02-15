import { useState, useEffect } from 'react';
import { supabase, filterActive } from '../lib/supabase';
import { ArrowLeft, Loader2, Search, BookOpen, X } from 'lucide-react';

interface Props {
  gestionId?: string;
  clienteId?: string;
  onNavigate: (page: any) => void;
}

interface Gestion {
  id: string;
  nombre: string;
  cliente_id: string;
  cliente_nombre: string;
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
}

// Map raw DB row to normalized interface (handles v4 and v5+ schema)
function mapRow(row: any): TramiteTipo {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    organismo: row.organismo || row.organismo_id || '',
    categoria: row.categoria || row.rubro || null,
    subcategoria: row.subcategoria || null,
    plataforma: row.plataforma || row.plataforma_gestion || null,
    plazo_dias: row.plazo_dias ?? row.sla_total_dias ?? null,
    costo_organismo: row.costo_organismo ?? row.costo_tasas_base ?? null,
    honorarios: row.honorarios ?? row.costo_honorarios_base ?? null,
    documentacion_obligatoria: row.documentacion_obligatoria || null,
  };
}

const ORGANISMOS_CATALOGO = ['INAL', 'ANMAT', 'SENASA', 'INTI', 'SEDRONAR', 'CITES', 'INASE', 'SIC'];
const PLATAFORMAS = ['TAD', 'TADO', 'VUCE', 'SIGSA', 'Otro'];

export default function NuevoTramiteV2({ gestionId, clienteId, onNavigate }: Props) {
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
    tipo: 'registro',
    organismo: '',
    plataforma: '',
    prioridad: 'normal',
    fecha_vencimiento: '',
    monto_presupuesto: '',
    descripcion: '',
  });

  useEffect(() => {
    // Load gestiones with client name
    filterActive(supabase.from('gestiones').select('id, nombre, cliente_id, clientes(razon_social)'))
      .not('estado', 'in', '("finalizado","archivado")')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const mapped = data.map((g: any) => ({
            id: g.id,
            nombre: g.nombre,
            cliente_id: g.cliente_id,
            cliente_nombre: g.clientes?.razon_social || '',
          }));
          setGestiones(mapped);
          // If gestionId was provided, auto-set cliente_id
          if (gestionId) {
            const gestion = mapped.find(g => g.id === gestionId);
            if (gestion) {
              setForm(prev => ({ ...prev, cliente_id: gestion.cliente_id }));
            }
          }
        }
      });

    supabase.from('tramite_tipos').select('*').order('nombre')
      .then(({ data }) => {
        if (data) setCatalogo(data.map(mapRow));
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
      setForm(prev => ({ ...prev, gestion_id: '', cliente_id: '' }));
    }
  };

  const selectedGestion = gestiones.find(g => g.id === form.gestion_id);

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

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gestion_id) return;
    setLoading(true);
    setError('');

    // Build insert payload - only include columns that have values
    const payload: Record<string, any> = {
      gestion_id: form.gestion_id,
      cliente_id: form.cliente_id,
      titulo: form.titulo,
      tipo: form.tipo,
      estado: 'consulta',
      prioridad: form.prioridad,
      semaforo: 'verde',
      progreso: 0,
    };
    if (form.tramite_tipo_id) payload.tramite_tipo_id = form.tramite_tipo_id;
    if (form.organismo) payload.organismo = form.organismo;
    if (form.plataforma) payload.plataforma = form.plataforma;
    if (form.fecha_vencimiento) payload.fecha_vencimiento = form.fecha_vencimiento;
    if (form.monto_presupuesto) payload.monto_presupuesto = parseFloat(form.monto_presupuesto);
    if (form.descripcion) payload.descripcion = form.descripcion;

    const { data, error: insertError } = await supabase
      .from('tramites')
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      console.error('Error creando trámite:', insertError);
      setError(insertError.message || 'Error al crear el trámite');
      setLoading(false);
      return;
    }

    if (data) {
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
      onNavigate({ type: 'gestiones' });
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

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
        <h1 className="text-[26px] tracking-tight font-bold text-slate-800 mb-1">Nuevo Trámite</h1>
        {selectedGestion ? (
          <p className="text-sm text-slate-500 mt-0.5">
            Gestión: <span className="font-medium text-slate-700">{selectedGestion.nombre}</span>
            {selectedGestion.cliente_nombre && <> — <span className="text-slate-600">{selectedGestion.cliente_nombre}</span></>}
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-400 mt-0.5 mb-4">Seleccioná una gestión para agregar el trámite</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gestión (proyecto) *</label>
              <select
                required
                value={form.gestion_id}
                onChange={e => handleGestionChange(e.target.value)}
                className={inputClass}
              >
                <option value="">Seleccionar gestión...</option>
                {gestiones.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.nombre} — {g.cliente_nombre}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Step 2: Select from catalog (only if gestion selected) */}
      {form.gestion_id && showCatalogo && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-slate-800">Catálogo de Trámites</h2>
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
                placeholder="Buscar por nombre, código o categoría..."
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
                    className="w-full text-left px-4 py-3 hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
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
                          {tipo.plazo_dias && <span className="text-[10px] text-slate-400">{tipo.plazo_dias} días</span>}
                          {tipo.documentacion_obligatoria?.length ? (
                            <span className="text-[10px] text-amber-600 font-medium">{tipo.documentacion_obligatoria.length} docs requeridos</span>
                          ) : null}
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
                    </div>
                    {/* Preview required docs */}
                    {tipo.documentacion_obligatoria?.length ? (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {tipo.documentacion_obligatoria.map((doc, i) => (
                          <span key={i} className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded">
                            {doc}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            ))}
            {filteredCatalogo.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <p className="text-sm">No se encontraron trámites en el catálogo</p>
              </div>
            )}
          </div>

          {/* Skip catalog */}
          <div className="p-3 border-t border-slate-100 text-center">
            <button
              onClick={() => setShowCatalogo(false)}
              className="text-xs text-slate-500 hover:text-blue-600 transition-colors"
            >
              Omitir catálogo y crear trámite manual
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Form details (only if gestion selected) */}
      {form.gestion_id && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Datos del trámite</h2>

          {/* Selected tipo badge */}
          {selectedTipo && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-800 truncate">{selectedTipo.nombre}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-blue-600">{selectedTipo.organismo}</span>
                    <span className="text-xs text-blue-500 font-mono">{selectedTipo.codigo}</span>
                    {selectedTipo.plazo_dias && <span className="text-xs text-blue-500">{selectedTipo.plazo_dias} días</span>}
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
              {selectedTipo.documentacion_obligatoria?.length ? (
                <div className="mt-2 pt-2 border-t border-blue-200/50">
                  <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1">
                    {selectedTipo.documentacion_obligatoria.length} documentos se cargarán automáticamente:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedTipo.documentacion_obligatoria.map((doc, i) => (
                      <span key={i} className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Título del trámite *</label>
              <input required value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ej: Registro de producto cosmético"
                className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de proceso</label>
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className={inputClass}>
                  <option value="registro">Registro</option>
                  <option value="habilitacion">Habilitación</option>
                  <option value="certificacion">Certificación</option>
                  <option value="importacion">Importación</option>
                  <option value="exportacion">Exportación</option>
                  <option value="inspeccion">Inspección</option>
                  <option value="autorizacion">Autorización</option>
                  <option value="renovacion">Renovación</option>
                  <option value="modificacion">Modificación</option>
                  <option value="otro">Otro</option>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Honorarios ($)</label>
                <input type="number" value={form.monto_presupuesto} onChange={e => setForm({ ...form, monto_presupuesto: e.target.value })}
                  placeholder="0.00"
                  className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={3}
                placeholder="Detalles del trámite..."
                className={inputClass} />
            </div>

            {!showCatalogo && !selectedTipo && (
              <button
                type="button"
                onClick={() => setShowCatalogo(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Seleccionar del catálogo
              </button>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={handleBack}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={loading || !form.gestion_id}
                className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Creando...</> : 'Crear Trámite'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
