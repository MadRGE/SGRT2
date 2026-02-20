import { useState, useEffect } from 'react';
import { supabase, filterActive } from '../lib/supabase';
import { ArrowLeft, Loader2, Search, BookOpen, X, DollarSign, Plus, Package } from 'lucide-react';

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
  const [selectedTipos, setSelectedTipos] = useState<TramiteTipo[]>([]);
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
    // Don't add duplicates
    if (selectedTipos.some(t => t.id === tipo.id)) return;
    const newSelected = [...selectedTipos, tipo];
    setSelectedTipos(newSelected);
    // Auto-fill gestión name from first tramite if empty
    if (!form.nombre || selectedTipos.length === 0) {
      const clienteName = clientes.find(c => c.id === selectedCliente)?.razon_social || '';
      if (newSelected.length === 1) {
        setForm(prev => ({
          ...prev,
          nombre: `${tipo.nombre}${clienteName ? ` - ${clienteName}` : ''}`,
        }));
      } else {
        setForm(prev => ({
          ...prev,
          nombre: `${newSelected.length} trámites${clienteName ? ` - ${clienteName}` : ''}`,
        }));
      }
    }
  };

  const handleRemoveTipo = (tipoId: string) => {
    const newSelected = selectedTipos.filter(t => t.id !== tipoId);
    setSelectedTipos(newSelected);
    // Update name if auto-generated
    if (newSelected.length === 0) {
      setForm(prev => ({ ...prev, nombre: '' }));
    } else if (newSelected.length === 1) {
      const clienteName = clientes.find(c => c.id === selectedCliente)?.razon_social || '';
      setForm(prev => ({
        ...prev,
        nombre: `${newSelected[0].nombre}${clienteName ? ` - ${clienteName}` : ''}`,
      }));
    }
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

    // Step 2: Create all selected tramites
    let tramitesCreados = 0;
    const tramitesFallidos: string[] = [];

    for (const tipo of selectedTipos) {
      const tramitePayload: Record<string, any> = {
        gestion_id: gestionData.id,
        cliente_id: selectedCliente,
        tramite_tipo_id: tipo.id,
        titulo: tipo.nombre,
        tipo: 'registro',
        estado: 'consulta',
        prioridad: form.prioridad,
        semaforo: 'verde',
        progreso: 0,
      };
      if (tipo.organismo) tramitePayload.organismo = tipo.organismo;
      if (tipo.plataforma) tramitePayload.plataforma = tipo.plataforma;
      if (tipo.honorarios) tramitePayload.monto_presupuesto = tipo.honorarios;

      const { data: tramiteData, error: tramiteError } = await supabase
        .from('tramites')
        .insert(tramitePayload)
        .select()
        .single();

      if (tramiteError) {
        console.error('Error creando trámite:', tramiteError);
        tramitesFallidos.push(tipo.nombre);
        continue;
      }

      tramitesCreados++;

      // Auto-create required documents for each tramite
      if (tramiteData && tipo.documentacion_obligatoria?.length) {
        const docsToInsert = tipo.documentacion_obligatoria.map(docName => ({
          tramite_id: tramiteData.id,
          nombre: docName,
          estado: 'pendiente',
          obligatorio: true,
          responsable: 'Cliente',
        }));
        await supabase.from('documentos_tramite').insert(docsToInsert);
      }
    }

    // Show error if some tramites failed
    if (tramitesFallidos.length > 0 && tramitesCreados === 0) {
      setError(`Error al crear todos los trámites: ${tramitesFallidos.join(', ')}. La gestión fue creada sin trámites.`);
      setLoading(false);
      return;
    }

    if (tramitesFallidos.length > 0) {
      // Some succeeded, some failed - still navigate but warn
      alert(`Gestión creada. ${tramitesCreados} trámite(s) creado(s). No se pudieron crear: ${tramitesFallidos.join(', ')}`);
    }

    // Navigate: if tramites were created, go to presupuesto; otherwise gestion detail
    if (tramitesCreados > 0) {
      onNavigate({ type: 'presupuesto', gestionId: gestionData.id });
    } else {
      onNavigate({ type: 'gestion', id: gestionData.id });
    }
    setLoading(false);
  };

  const selectedClienteName = clientes.find(c => c.id === selectedCliente)?.razon_social;
  const totalHonorarios = selectedTipos.reduce((sum, t) => sum + (t.honorarios || 0), 0);
  const totalTasas = selectedTipos.reduce((sum, t) => sum + (t.costo_organismo || 0), 0);
  const inputClass = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => onNavigate({ type: 'gestiones' })} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      {/* Step 1: Select client */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
        <h1 className="text-[26px] tracking-tight font-bold text-slate-800 mb-1">Nueva Gestión</h1>
        <p className="text-sm text-slate-400 mt-0.5 mb-6">Seleccioná un cliente y los trámites a gestionar</p>

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

      {/* Selected tramites summary */}
      {selectedTipos.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-slate-800">Trámites seleccionados ({selectedTipos.length})</h2>
            {totalHonorarios > 0 && (
              <span className="ml-auto text-sm font-semibold text-green-700">
                Total: ${totalHonorarios.toLocaleString('es-AR')}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {selectedTipos.map(tipo => (
              <div key={tipo.id} className="flex items-center gap-3 p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-800 truncate">{tipo.nombre}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-blue-600">{tipo.organismo}</span>
                    <span className="text-xs text-blue-500 font-mono">{tipo.codigo}</span>
                    {tipo.honorarios ? (
                      <span className="text-xs font-semibold text-green-700">${tipo.honorarios.toLocaleString('es-AR')}</span>
                    ) : null}
                    {tipo.costo_organismo ? (
                      <span className="text-[10px] text-slate-500">Tasa: ${tipo.costo_organismo.toLocaleString('es-AR')}</span>
                    ) : null}
                  </div>
                </div>
                <button onClick={() => handleRemoveTipo(tipo.id)} className="p-1 text-blue-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          {totalTasas > 0 && (
            <p className="text-xs text-slate-500 mt-2 text-right">Tasas organismo: ${totalTasas.toLocaleString('es-AR')}</p>
          )}
          {showCatalogo ? (
            <p className="text-xs text-slate-400 mt-2 text-center">Podés seguir agregando trámites del catálogo</p>
          ) : (
            <button
              onClick={() => setShowCatalogo(true)}
              className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mx-auto"
            >
              <Plus className="w-3 h-3" /> Agregar otro trámite
            </button>
          )}
        </div>
      )}

      {/* Step 2: Select tramites from catalog (visible after client selected) */}
      {selectedCliente && showCatalogo && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-slate-800">
                {selectedTipos.length === 0 ? 'Seleccioná los trámites a realizar' : 'Agregar más trámites'}
              </h2>
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
                {filteredCatalogo.filter(t => t.organismo === org).map(tipo => {
                  const isSelected = selectedTipos.some(t => t.id === tipo.id);
                  return (
                    <button
                      key={tipo.id}
                      onClick={() => handleSelectTipo(tipo)}
                      disabled={isSelected}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        isSelected ? 'bg-blue-50/70 opacity-60' : 'hover:bg-blue-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-400">{tipo.codigo}</span>
                            {tipo.categoria && (
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{tipo.categoria}</span>
                            )}
                            {isSelected && (
                              <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">Agregado</span>
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
                  );
                })}
              </div>
            ))}
            {filteredCatalogo.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <p className="text-sm">No se encontraron trámites en el catálogo</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setShowCatalogo(false)}
              className="text-xs text-slate-500 hover:text-blue-600 transition-colors"
            >
              {selectedTipos.length === 0 ? 'Omitir catálogo y crear gestión sin trámite' : 'Listo, continuar con la gestión'}
            </button>
            {selectedTipos.length > 0 && (
              <span className="text-xs font-medium text-blue-600">
                {selectedTipos.length} trámite{selectedTipos.length > 1 ? 's' : ''} seleccionado{selectedTipos.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Form details (visible after client selected) */}
      {selectedCliente && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Datos de la gestión</h2>

          {!showCatalogo && selectedTipos.length === 0 && (
            <button
              type="button"
              onClick={() => setShowCatalogo(true)}
              className="mb-4 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Seleccionar trámites del catálogo
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
                  selectedTipos.length > 1 ? `Crear Gestión + ${selectedTipos.length} Trámites` :
                  selectedTipos.length === 1 ? 'Crear Gestión + Trámite' : 'Crear Gestión'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
