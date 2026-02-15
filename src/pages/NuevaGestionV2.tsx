import { useState, useEffect } from 'react';
import { supabase, filterActive } from '../lib/supabase';
import { ArrowLeft, Loader2, Search, BookOpen, X, DollarSign } from 'lucide-react';

interface Props {
  clienteId?: string;
  onNavigate: (page: any) => void;
}

interface Cliente {
  id: string;
  razon_social: string;
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

export default function NuevaGestionV2({ clienteId, onNavigate }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [catalogo, setCatalogo] = useState<TramiteTipo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(clienteId || '');
  const [selectedTipo, setSelectedTipo] = useState<TramiteTipo | null>(null);
  const [selectedOrganismo, setSelectedOrganismo] = useState('');
  const [searchCatalogo, setSearchCatalogo] = useState('');
  const [showCatalogo, setShowCatalogo] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    prioridad: 'normal',
    fecha_inicio: new Date().toISOString().split('T')[0],
    observaciones: '',
  });

  useEffect(() => {
    filterActive(supabase.from('clientes').select('id, razon_social')).order('razon_social')
      .then(({ data }) => { if (data) setClientes(data); });

    supabase.from('tramite_tipos').select('*').order('nombre')
      .then(({ data }) => { if (data) setCatalogo(data.map(mapRow)); });
  }, []);

  // Dynamic organismos from catalog data
  const catalogoOrganismos = [...new Set(catalogo.map(t => t.organismo))].sort();

  // Filter catalog
  const filteredCatalogo = catalogo.filter(t => {
    if (selectedOrganismo && t.organismo !== selectedOrganismo) return false;
    if (searchCatalogo) {
      const q = searchCatalogo.toLowerCase();
      return t.nombre.toLowerCase().includes(q) || t.codigo.toLowerCase().includes(q) ||
        (t.categoria || '').toLowerCase().includes(q);
    }
    return true;
  });

  const organismos = [...new Set(filteredCatalogo.map(t => t.organismo))];

  const handleSelectTipo = (tipo: TramiteTipo) => {
    setSelectedTipo(tipo);
    setShowCatalogo(false);
    // Auto-fill gestión name from tramite if empty
    if (!form.nombre) {
      const clienteName = clientes.find(c => c.id === selectedCliente)?.razon_social || '';
      setForm(prev => ({
        ...prev,
        nombre: `${tipo.nombre}${clienteName ? ` - ${clienteName}` : ''}`,
      }));
    }
  };

  const handleClearTipo = () => {
    setSelectedTipo(null);
    setShowCatalogo(true);
    setForm(prev => ({ ...prev, nombre: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCliente) return;
    setLoading(true);
    setError('');

    // Step 1: Create gestión
    const { data: gestionData, error: gestionError } = await supabase
      .from('gestiones')
      .insert({
        cliente_id: selectedCliente,
        nombre: form.nombre,
        descripcion: form.descripcion || null,
        prioridad: form.prioridad,
        fecha_inicio: form.fecha_inicio || null,
        observaciones: form.observaciones || null,
        estado: 'relevamiento',
      })
      .select()
      .single();

    if (gestionError || !gestionData) {
      console.error('Error creando gestión:', gestionError);
      setError(gestionError?.message || 'Error al crear la gestión');
      setLoading(false);
      return;
    }

    // Step 2: If a tramite type was selected, auto-create the first tramite
    if (selectedTipo) {
      const tramitePayload: Record<string, any> = {
        gestion_id: gestionData.id,
        cliente_id: selectedCliente,
        tramite_tipo_id: selectedTipo.id,
        titulo: selectedTipo.nombre,
        tipo: 'registro',
        estado: 'consulta',
        prioridad: form.prioridad,
        semaforo: 'verde',
        progreso: 0,
      };
      if (selectedTipo.organismo) tramitePayload.organismo = selectedTipo.organismo;
      if (selectedTipo.plataforma) tramitePayload.plataforma = selectedTipo.plataforma;
      if (selectedTipo.honorarios) tramitePayload.monto_presupuesto = selectedTipo.honorarios;

      const { data: tramiteData, error: tramiteError } = await supabase
        .from('tramites')
        .insert(tramitePayload)
        .select()
        .single();

      if (tramiteError) {
        console.error('Error creando trámite:', tramiteError);
        // Still navigate to gestión even if tramite creation fails
      }

      // Auto-create required documents
      if (!tramiteError && tramiteData && selectedTipo.documentacion_obligatoria?.length) {
        const docsToInsert = selectedTipo.documentacion_obligatoria.map(docName => ({
          tramite_id: tramiteData.id,
          nombre: docName,
          estado: 'pendiente',
          obligatorio: true,
          responsable: 'Cliente',
        }));
        await supabase.from('documentos_tramite').insert(docsToInsert);
      }
    }

    // Navigate: if tramite was selected, go to presupuesto; otherwise gestion detail
    if (selectedTipo) {
      onNavigate({ type: 'presupuesto', gestionId: gestionData.id });
    } else {
      onNavigate({ type: 'gestion', id: gestionData.id });
    }
    setLoading(false);
  };

  const selectedClienteName = clientes.find(c => c.id === selectedCliente)?.razon_social;
  const inputClass = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => onNavigate({ type: 'gestiones' })} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      {/* Step 1: Select client */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
        <h1 className="text-[26px] tracking-tight font-bold text-slate-800 mb-1">Nueva Gestión</h1>
        <p className="text-sm text-slate-400 mt-0.5 mb-6">Seleccioná un cliente y el trámite a gestionar</p>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
          <select
            required
            value={selectedCliente}
            onChange={e => setSelectedCliente(e.target.value)}
            className={inputClass}
          >
            <option value="">Seleccionar cliente...</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
          </select>
        </div>

        {selectedCliente && selectedClienteName && (
          <p className="text-xs text-slate-400 mt-2">
            Cliente: <span className="font-medium text-slate-600">{selectedClienteName}</span>
          </p>
        )}
      </div>

      {/* Step 2: Select tramite from catalog (visible after client selected) */}
      {selectedCliente && showCatalogo && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-slate-800">Seleccioná el trámite a realizar</h2>
              <span className="text-xs text-slate-400 ml-auto">{catalogo.length} tipos disponibles</span>
            </div>

            {/* Organismo filter pills - dynamic from data */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                onClick={() => setSelectedOrganismo('')}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  !selectedOrganismo ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                }`}
              >
                Todos
              </button>
              {catalogoOrganismos.map(org => {
                const count = catalogo.filter(t => t.organismo === org).length;
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
                          <span className="flex items-center gap-1 text-sm font-semibold text-green-700">
                            <DollarSign className="w-3.5 h-3.5" />
                            {tipo.honorarios.toLocaleString('es-AR')}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Sin precio</span>
                        )}
                        {tipo.costo_organismo ? (
                          <p className="text-[10px] text-slate-400">Tasa: ${tipo.costo_organismo.toLocaleString('es-AR')}</p>
                        ) : null}
                      </div>
                    </div>
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
              Omitir catálogo y crear gestión sin trámite
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Form details (visible after client selected) */}
      {selectedCliente && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Datos de la gestión</h2>

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
                    {selectedTipo.honorarios ? (
                      <span className="text-xs font-semibold text-green-700">${selectedTipo.honorarios.toLocaleString('es-AR')}</span>
                    ) : null}
                  </div>
                </div>
                <button onClick={handleClearTipo} className="p-1 text-blue-400 hover:text-blue-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {selectedTipo.documentacion_obligatoria?.length ? (
                <div className="mt-2 pt-2 border-t border-blue-200/50">
                  <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1">
                    {selectedTipo.documentacion_obligatoria.length} documentos se cargarán automáticamente
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

          {!showCatalogo && !selectedTipo && (
            <button
              type="button"
              onClick={() => setShowCatalogo(true)}
              className="mb-4 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Seleccionar trámite del catálogo
            </button>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la gestión *</label>
              <input required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                placeholder="Ej: Importación línea cosméticos 2026"
                className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} rows={3}
                placeholder="Detalles de la gestión..."
                className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
                <select value={form.prioridad} onChange={e => setForm({...form, prioridad: e.target.value})}
                  className={inputClass}>
                  <option value="baja">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio</label>
                <input type="date" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})}
                  className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
              <textarea value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} rows={2}
                placeholder="Notas adicionales..."
                className={inputClass} />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => onNavigate({ type: 'gestiones' })}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Creando...</> :
                  selectedTipo ? 'Crear Gestión + Trámite' : 'Crear Gestión'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
