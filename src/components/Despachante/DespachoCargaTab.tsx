import { useState } from 'react';
import { Package, Plus, Trash2, Edit3, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { type Carga, todayLocal } from '../../services/DespachoService';
import { CARGA_ESTADO_LABELS, CARGA_ESTADO_COLORS, CARGA_TRANSITIONS, TRANSPORTE_TIPO_LABELS, TRANSPORTE_TIPOS } from '../../lib/constants/despacho';
import CargaTimeline from './CargaTimeline';
import ConfirmDialog, { useConfirmDialog } from '../UI/ConfirmDialog';

interface Props {
  despachoId: string;
  cargas: Carga[];
  onReload: () => void;
}

export default function DespachoCargaTab({ despachoId, cargas, onReload }: Props) {
  const { confirm, dialogProps } = useConfirmDialog();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    tipo_transporte: 'maritimo',
    numero_contenedor: '',
    numero_bl: '',
    numero_awb: '',
    booking_number: '',
    naviera_aerolinea: '',
    buque_vuelo: '',
    puerto_origen: '',
    puerto_destino: '',
    peso_kg: '',
    volumen_m3: '',
    cantidad_bultos: '',
    fecha_embarque: '',
    fecha_arribo_estimado: '',
  });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm({
      tipo_transporte: 'maritimo', numero_contenedor: '', numero_bl: '', numero_awb: '',
      booking_number: '', naviera_aerolinea: '', buque_vuelo: '', puerto_origen: '',
      puerto_destino: '', peso_kg: '', volumen_m3: '', cantidad_bultos: '',
      fecha_embarque: '', fecha_arribo_estimado: '',
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      despacho_id: despachoId,
      tipo_transporte: form.tipo_transporte,
      numero_contenedor: form.numero_contenedor || null,
      numero_bl: form.numero_bl || null,
      numero_awb: form.numero_awb || null,
      booking_number: form.booking_number || null,
      naviera_aerolinea: form.naviera_aerolinea || null,
      buque_vuelo: form.buque_vuelo || null,
      puerto_origen: form.puerto_origen || null,
      puerto_destino: form.puerto_destino || null,
      peso_kg: form.peso_kg ? parseFloat(form.peso_kg) : null,
      volumen_m3: form.volumen_m3 ? parseFloat(form.volumen_m3) : null,
      cantidad_bultos: form.cantidad_bultos ? parseInt(form.cantidad_bultos) : null,
      fecha_embarque: form.fecha_embarque || null,
      fecha_arribo_estimado: form.fecha_arribo_estimado || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('cargas').update(data).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('cargas').insert([data]));
    }

    if (error) {
      toast.error('Error: ' + error.message);
    } else {
      toast.success(editingId ? 'Carga actualizada' : 'Carga agregada');
      resetForm();
      setShowAdd(false);
      setEditingId(null);
      onReload();
    }
    setSaving(false);
  };

  const handleEdit = (carga: Carga) => {
    setForm({
      tipo_transporte: carga.tipo_transporte,
      numero_contenedor: carga.numero_contenedor || '',
      numero_bl: carga.numero_bl || '',
      numero_awb: carga.numero_awb || '',
      booking_number: carga.booking_number || '',
      naviera_aerolinea: carga.naviera_aerolinea || '',
      buque_vuelo: carga.buque_vuelo || '',
      puerto_origen: carga.puerto_origen || '',
      puerto_destino: carga.puerto_destino || '',
      peso_kg: carga.peso_kg?.toString() || '',
      volumen_m3: carga.volumen_m3?.toString() || '',
      cantidad_bultos: carga.cantidad_bultos?.toString() || '',
      fecha_embarque: carga.fecha_embarque || '',
      fecha_arribo_estimado: carga.fecha_arribo_estimado || '',
    });
    setEditingId(carga.id);
    setShowAdd(true);
  };

  const handleEstadoChange = async (cargaId: string, nuevoEstado: string) => {
    const dateField = nuevoEstado === 'en_puerto' ? 'fecha_arribo_real'
      : nuevoEstado === 'deposito_fiscal' ? 'fecha_ingreso_deposito'
      : nuevoEstado === 'liberado' ? 'fecha_liberacion'
      : null;

    const update: Record<string, any> = { estado: nuevoEstado };
    if (dateField) update[dateField] = todayLocal();

    const { error } = await supabase.from('cargas').update(update).eq('id', cargaId);
    if (!error) {
      toast.success(`Estado actualizado a ${CARGA_ESTADO_LABELS[nuevoEstado]}`);
      onReload();
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ message: '¿Eliminar esta carga? Esta acción no se puede deshacer.', title: 'Eliminar carga' });
    if (!ok) return;
    const { error } = await supabase.from('cargas').delete().eq('id', id);
    if (!error) {
      toast.success('Carga eliminada');
      onReload();
    }
  };

  const inputClass = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white';

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { resetForm(); setEditingId(null); setShowAdd(true); }}
          className="flex items-center gap-1.5 text-sm bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700"
        >
          <Plus className="w-4 h-4" /> Nueva Carga
        </button>
      </div>

      {/* Cargas list */}
      {cargas.map((carga) => {
        const transitions = CARGA_TRANSITIONS[carga.estado] || [];
        return (
          <div key={carga.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="p-4 border-b border-slate-100">
              {/* Timeline visual */}
              <CargaTimeline estado={carga.estado} />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-slate-800 text-sm">
                    {TRANSPORTE_TIPO_LABELS[carga.tipo_transporte] || carga.tipo_transporte}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${CARGA_ESTADO_COLORS[carga.estado]}`}>
                    {CARGA_ESTADO_LABELS[carga.estado]}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {transitions.length > 0 && (
                    <button
                      onClick={() => handleEstadoChange(carga.id, transitions[0])}
                      className="text-xs text-amber-600 hover:text-amber-700 font-medium px-2 py-1 bg-amber-50 rounded-lg hover:bg-amber-100"
                    >
                      → {CARGA_ESTADO_LABELS[transitions[0]]}
                    </button>
                  )}
                  <button onClick={() => handleEdit(carga)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(carga.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {carga.numero_contenedor && <div><p className="text-xs text-slate-500">Contenedor</p><p className="font-mono text-slate-700">{carga.numero_contenedor}</p></div>}
                {carga.numero_bl && <div><p className="text-xs text-slate-500">BL</p><p className="font-mono text-slate-700">{carga.numero_bl}</p></div>}
                {carga.numero_awb && <div><p className="text-xs text-slate-500">AWB</p><p className="font-mono text-slate-700">{carga.numero_awb}</p></div>}
                {carga.naviera_aerolinea && <div><p className="text-xs text-slate-500">Naviera/Aerolínea</p><p className="text-slate-700">{carga.naviera_aerolinea}</p></div>}
                {carga.buque_vuelo && <div><p className="text-xs text-slate-500">Buque/Vuelo</p><p className="text-slate-700">{carga.buque_vuelo}</p></div>}
                {carga.puerto_origen && <div><p className="text-xs text-slate-500">Origen</p><p className="text-slate-700">{carga.puerto_origen}</p></div>}
                {carga.puerto_destino && <div><p className="text-xs text-slate-500">Destino</p><p className="text-slate-700">{carga.puerto_destino}</p></div>}
                {carga.fecha_arribo_estimado && <div><p className="text-xs text-slate-500">ETA</p><p className="text-slate-700">{new Date(carga.fecha_arribo_estimado).toLocaleDateString('es-AR')}</p></div>}
              </div>
            </div>
          </div>
        );
      })}

      {cargas.length === 0 && !showAdd && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center">
          <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-slate-500 text-sm">No hay cargas registradas</p>
          <button onClick={() => setShowAdd(true)} className="text-sm text-amber-600 font-medium mt-2 hover:underline">
            Agregar la primera
          </button>
        </div>
      )}

      {/* Add/Edit form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm">
          <div className="p-4 border-b border-amber-100 flex items-center justify-between bg-amber-50/50 rounded-t-2xl">
            <h3 className="font-semibold text-amber-800 text-sm">
              {editingId ? 'Editar Carga' : 'Nueva Carga'}
            </h3>
            <button onClick={() => { setShowAdd(false); setEditingId(null); }} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Transporte</label>
                <select value={form.tipo_transporte} onChange={(e) => setForm({ ...form, tipo_transporte: e.target.value })} className={inputClass}>
                  {TRANSPORTE_TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nº Contenedor</label>
                <input value={form.numero_contenedor} onChange={(e) => setForm({ ...form, numero_contenedor: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">BL / AWB</label>
                <input value={form.tipo_transporte === 'aereo' ? form.numero_awb : form.numero_bl}
                  onChange={(e) => setForm({ ...form, [form.tipo_transporte === 'aereo' ? 'numero_awb' : 'numero_bl']: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Naviera / Aerolínea</label>
                <input value={form.naviera_aerolinea} onChange={(e) => setForm({ ...form, naviera_aerolinea: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Buque / Vuelo</label>
                <input value={form.buque_vuelo} onChange={(e) => setForm({ ...form, buque_vuelo: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Booking Nº</label>
                <input value={form.booking_number} onChange={(e) => setForm({ ...form, booking_number: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Puerto Origen</label>
                <input value={form.puerto_origen} onChange={(e) => setForm({ ...form, puerto_origen: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Puerto Destino</label>
                <input value={form.puerto_destino} onChange={(e) => setForm({ ...form, puerto_destino: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fecha Embarque</label>
                <input type="date" value={form.fecha_embarque} onChange={(e) => setForm({ ...form, fecha_embarque: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ETA</label>
                <input type="date" value={form.fecha_arribo_estimado} onChange={(e) => setForm({ ...form, fecha_arribo_estimado: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Peso (kg)</label>
                <input type="number" value={form.peso_kg} onChange={(e) => setForm({ ...form, peso_kg: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Volumen (m³)</label>
                <input type="number" step="0.01" value={form.volumen_m3} onChange={(e) => setForm({ ...form, volumen_m3: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Bultos</label>
                <input type="number" value={form.cantidad_bultos} onChange={(e) => setForm({ ...form, cantidad_bultos: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setShowAdd(false); setEditingId(null); }} className="px-4 py-2 text-sm text-slate-600">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
