import { useState, useEffect, useRef } from 'react';
import { Loader2, ArrowLeft, Ship, Edit3, Save, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, buildSeguimientoData } from '../../lib/supabase';
import { DespachoService, type Despacho, type DespachoDoc, type Liquidacion, type Carga, todayLocal } from '../../services/DespachoService';
import {
  DESPACHO_ESTADO_LABELS,
  DESPACHO_ESTADO_COLORS_BORDER,
  DESPACHO_TRANSITIONS,
  DESPACHO_TIPO_LABELS,
  DESPACHO_TIPO_COLORS,
} from '../../lib/constants/despacho';
import { PRIORIDAD_COLORS } from '../../lib/constants/estados';
import DespachoDocumentosTab from '../../components/Despachante/DespachoDocumentosTab';
import DespachoLiquidacionTab from '../../components/Despachante/DespachoLiquidacionTab';
import DespachoCargaTab from '../../components/Despachante/DespachoCargaTab';
import SeguimientoSection from '../../components/Tramite/SeguimientoSection';

type Tab = 'general' | 'documentos' | 'liquidacion' | 'carga' | 'seguimiento';

interface Props {
  despachoId: string;
  onBack: () => void;
  onNavigate?: (view: any) => void;
}

interface Seguimiento {
  id: string;
  descripcion: string;
  created_at: string;
  usuario_nombre?: string | null;
}

export default function DespachoDetailPage({ despachoId, onBack, onNavigate }: Props) {
  const { user } = useAuth();
  const [despacho, setDespacho] = useState<Despacho | null>(null);
  const [docs, setDocs] = useState<DespachoDoc[]>([]);
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Despacho>>({});
  const [saving, setSaving] = useState(false);

  // Estado dropdown (click-toggle for touch/keyboard accessibility)
  const [estadoDropdownOpen, setEstadoDropdownOpen] = useState(false);
  const estadoDropdownRef = useRef<HTMLDivElement>(null);

  // Seguimiento state
  const [nuevoSeguimiento, setNuevoSeguimiento] = useState('');
  const [savingSeg, setSavingSeg] = useState(false);

  useEffect(() => {
    loadData();
  }, [despachoId]);

  // Close estado dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (estadoDropdownRef.current && !estadoDropdownRef.current.contains(e.target as Node)) {
        setEstadoDropdownOpen(false);
      }
    };
    if (estadoDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [estadoDropdownOpen]);

  const loadData = async () => {
    setLoading(true);
    const [d, docsData, liqData, cargasData, segData] = await Promise.all([
      DespachoService.getDespachoById(despachoId),
      DespachoService.getDocsByDespacho(despachoId),
      DespachoService.getLiquidacionesByDespacho(despachoId),
      DespachoService.getCargasByDespacho(despachoId),
      supabase
        .from('seguimientos')
        .select('id, descripcion, created_at, usuario_nombre')
        .eq('despacho_id', despachoId)
        .order('created_at', { ascending: false }),
    ]);

    setDespacho(d);
    setDocs(docsData);
    setLiquidaciones(liqData);
    setCargas(cargasData);
    setSeguimientos(segData.data || []);
    setLoading(false);
  };

  const handleEstadoChange = async (nuevoEstado: string) => {
    if (!despacho) return;
    const today = todayLocal();
    const { success, error } = await DespachoService.updateDespacho(despachoId, {
      estado: nuevoEstado,
      ...(nuevoEstado === 'presentado' && { fecha_presentacion: today }),
      ...(nuevoEstado.startsWith('canal_') && { fecha_canal: today }),
      ...(nuevoEstado === 'liberado' && { fecha_liberacion: today }),
    } as Partial<Despacho>);

    if (success) {
      // Auto-create seguimiento for estado change
      await supabase.from('seguimientos').insert(
        buildSeguimientoData({
          despacho_id: despachoId,
          descripcion: `Estado cambiado a: ${DESPACHO_ESTADO_LABELS[nuevoEstado] || nuevoEstado}`,
          tipo: 'cambio_estado',
        }, user)
      );
      toast.success(`Estado actualizado a ${DESPACHO_ESTADO_LABELS[nuevoEstado]}`);
      loadData();
    } else {
      toast.error(error || 'Error al actualizar estado');
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    const { success, error } = await DespachoService.updateDespacho(despachoId, editForm);
    if (success) {
      toast.success('Despacho actualizado');
      setEditing(false);
      loadData();
    } else {
      toast.error(error || 'Error al guardar');
    }
    setSaving(false);
  };

  const handleAddSeguimiento = async () => {
    if (!nuevoSeguimiento.trim()) return;
    setSavingSeg(true);
    const { error } = await supabase.from('seguimientos').insert(
      buildSeguimientoData({
        despacho_id: despachoId,
        descripcion: nuevoSeguimiento.trim(),
        tipo: 'nota',
      }, user)
    );
    if (!error) {
      setNuevoSeguimiento('');
      loadData();
    }
    setSavingSeg(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!despacho) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Despacho no encontrado</p>
        <button onClick={onBack} className="text-amber-600 font-medium mt-2 hover:underline">Volver</button>
      </div>
    );
  }

  const allowedTransitions = DESPACHO_TRANSITIONS[despacho.estado] || [];

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'general', label: 'General' },
    { id: 'documentos', label: 'Documentos', count: docs.length },
    { id: 'liquidacion', label: 'Liquidación', count: liquidaciones.length },
    { id: 'carga', label: 'Carga', count: cargas.length },
    { id: 'seguimiento', label: 'Seguimiento', count: seguimientos.length },
  ];

  const inputClass = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors';

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3">
          <ArrowLeft className="w-4 h-4" /> Volver a despachos
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
              <Ship className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{despacho.numero_despacho}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${DESPACHO_TIPO_COLORS[despacho.tipo]}`}>
                  {DESPACHO_TIPO_LABELS[despacho.tipo]}
                </span>
                {despacho.cliente_id && onNavigate ? (
                  <button
                    onClick={() => onNavigate({ type: 'cliente', id: despacho.cliente_id })}
                    className="text-xs text-amber-600 hover:text-amber-700 hover:underline font-medium"
                  >
                    {despacho.clientes?.razon_social}
                  </button>
                ) : (
                  <span className="text-xs text-slate-500">{despacho.clientes?.razon_social}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Estado badge */}
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${DESPACHO_ESTADO_COLORS_BORDER[despacho.estado] || 'bg-slate-100 text-slate-700 border-slate-300'}`}>
              {DESPACHO_ESTADO_LABELS[despacho.estado] || despacho.estado}
            </span>

            {/* Estado transitions */}
            {allowedTransitions.length > 0 && (
              <div className="relative" ref={estadoDropdownRef}>
                <button
                  onClick={() => setEstadoDropdownOpen(!estadoDropdownOpen)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium hover:bg-amber-100 transition-colors"
                >
                  Cambiar Estado <ChevronDown className={`w-3 h-3 transition-transform ${estadoDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {estadoDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-10 min-w-[160px]">
                    {allowedTransitions.map((est) => (
                      <button
                        key={est}
                        onClick={() => { handleEstadoChange(est); setEstadoDropdownOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                      >
                        {DESPACHO_ESTADO_LABELS[est]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Prioridad */}
            <div className={`w-3 h-3 rounded-full ${PRIORIDAD_COLORS[despacho.prioridad] || 'bg-blue-400'}`} title={`Prioridad: ${despacho.prioridad}`} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-200/60 p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-amber-50 text-amber-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                activeTab === tab.id ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Información General</h2>
            {!editing ? (
              <button onClick={() => { setEditing(true); setEditForm({ ...despacho }); }}
                className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium">
                <Edit3 className="w-4 h-4" /> Editar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                  <X className="w-4 h-4" /> Cancelar
                </button>
                <button onClick={handleSaveEdit} disabled={saving}
                  className="flex items-center gap-1.5 text-sm bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 disabled:opacity-50">
                  <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            )}
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mercadería */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Mercadería</h3>
              <div>
                <label className="text-xs text-slate-500">Descripción</label>
                {editing ? (
                  <textarea value={editForm.descripcion || ''} onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                    className={inputClass} rows={3} />
                ) : (
                  <p className="text-sm text-slate-700 mt-1">{despacho.descripcion || '-'}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500">Posición Arancelaria (NCM)</label>
                  {editing ? (
                    <input value={editForm.posicion_arancelaria || ''} onChange={(e) => setEditForm({ ...editForm, posicion_arancelaria: e.target.value })}
                      className={inputClass} placeholder="0000.00.00" />
                  ) : (
                    <p className="text-sm text-slate-700 font-mono mt-1">{despacho.posicion_arancelaria || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500">Valor FOB</label>
                  {editing ? (
                    <input type="number" step="0.01" value={editForm.valor_fob || ''} onChange={(e) => setEditForm({ ...editForm, valor_fob: parseFloat(e.target.value) || 0 })}
                      className={inputClass} />
                  ) : (
                    <p className="text-sm text-slate-700 mt-1">{despacho.valor_fob ? DespachoService.formatMonto(despacho.valor_fob, despacho.moneda) : '-'}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500">Valor CIF</label>
                  {editing ? (
                    <input type="number" step="0.01" value={editForm.valor_cif || ''} onChange={(e) => setEditForm({ ...editForm, valor_cif: parseFloat(e.target.value) || 0 })}
                      className={inputClass} />
                  ) : (
                    <p className="text-sm text-slate-700 mt-1">{despacho.valor_cif ? DespachoService.formatMonto(despacho.valor_cif, despacho.moneda) : '-'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500">Peso (kg)</label>
                  {editing ? (
                    <input type="number" step="0.01" value={editForm.peso_kg || ''} onChange={(e) => setEditForm({ ...editForm, peso_kg: parseFloat(e.target.value) || 0 })}
                      className={inputClass} />
                  ) : (
                    <p className="text-sm text-slate-700 mt-1">{despacho.peso_kg ? `${despacho.peso_kg.toLocaleString('es-AR')} kg` : '-'}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500">Cantidad de Bultos</label>
                {editing ? (
                  <input type="number" value={editForm.cantidad_bultos || ''} onChange={(e) => setEditForm({ ...editForm, cantidad_bultos: parseInt(e.target.value) || 0 })}
                    className={inputClass} />
                ) : (
                  <p className="text-sm text-slate-700 mt-1">{despacho.cantidad_bultos || '-'}</p>
                )}
              </div>
            </div>

            {/* Transporte + Fechas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Transporte</h3>
              <div>
                <label className="text-xs text-slate-500">Número de Guía (BL/AWB)</label>
                {editing ? (
                  <input value={editForm.numero_guia || ''} onChange={(e) => setEditForm({ ...editForm, numero_guia: e.target.value })}
                    className={inputClass} />
                ) : (
                  <p className="text-sm text-slate-700 mt-1">{despacho.numero_guia || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-slate-500">Booking Number</label>
                {editing ? (
                  <input value={editForm.booking_number || ''} onChange={(e) => setEditForm({ ...editForm, booking_number: e.target.value })}
                    className={inputClass} />
                ) : (
                  <p className="text-sm text-slate-700 mt-1">{despacho.booking_number || '-'}</p>
                )}
              </div>

              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider pt-2">Fechas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500">Presentación</label>
                  <p className="text-sm text-slate-700 mt-1">{despacho.fecha_presentacion ? new Date(despacho.fecha_presentacion).toLocaleDateString('es-AR') : '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Oficialización</label>
                  {editing ? (
                    <input type="date" value={editForm.fecha_oficializacion || ''} onChange={(e) => setEditForm({ ...editForm, fecha_oficializacion: e.target.value })}
                      className={inputClass} />
                  ) : (
                    <p className="text-sm text-slate-700 mt-1">{despacho.fecha_oficializacion ? new Date(despacho.fecha_oficializacion).toLocaleDateString('es-AR') : '-'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500">Canal</label>
                  <p className="text-sm text-slate-700 mt-1">{despacho.fecha_canal ? new Date(despacho.fecha_canal).toLocaleDateString('es-AR') : '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Liberación</label>
                  <p className="text-sm text-slate-700 mt-1">{despacho.fecha_liberacion ? new Date(despacho.fecha_liberacion).toLocaleDateString('es-AR') : '-'}</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500">Observaciones</label>
                {editing ? (
                  <textarea value={editForm.observaciones || ''} onChange={(e) => setEditForm({ ...editForm, observaciones: e.target.value })}
                    className={inputClass} rows={3} />
                ) : (
                  <p className="text-sm text-slate-700 mt-1">{despacho.observaciones || '-'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documentos' && (
        <DespachoDocumentosTab despachoId={despachoId} docs={docs} onReload={loadData} />
      )}

      {activeTab === 'liquidacion' && (
        <DespachoLiquidacionTab despachoId={despachoId} liquidaciones={liquidaciones} despacho={despacho} onReload={loadData} />
      )}

      {activeTab === 'carga' && (
        <DespachoCargaTab despachoId={despachoId} cargas={cargas} onReload={loadData} />
      )}

      {activeTab === 'seguimiento' && (
        <SeguimientoSection
          seguimientos={seguimientos}
          nuevoSeguimiento={nuevoSeguimiento}
          setNuevoSeguimiento={setNuevoSeguimiento}
          savingSeg={savingSeg}
          onAddSeguimiento={handleAddSeguimiento}
        />
      )}
    </div>
  );
}
