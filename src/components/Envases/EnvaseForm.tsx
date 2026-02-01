import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';

interface Props {
  clienteId: string;
  envase?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIAS = [
  { value: 'envase_primario', label: 'Envase Primario' },
  { value: 'tapa_cierre', label: 'Tapa/Cierre' },
  { value: 'film_flexible', label: 'Film Flexible' },
  { value: 'botella', label: 'Botella' },
  { value: 'frasco', label: 'Frasco' },
  { value: 'otro', label: 'Otro' }
];

const MATERIALES = [
  { value: 'PET', label: 'PET', riesgo: 'I' },
  { value: 'PEAD', label: 'PEAD', riesgo: 'I' },
  { value: 'PP', label: 'PP', riesgo: 'I' },
  { value: 'PVC', label: 'PVC', riesgo: 'II' },
  { value: 'Vidrio', label: 'Vidrio', riesgo: 'I' },
  { value: 'Aluminio', label: 'Aluminio', riesgo: 'I' },
  { value: 'Multicapa', label: 'Multicapa', riesgo: 'II' }
];

export default function EnvaseForm({ clienteId, envase, onClose, onSuccess }: Props) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    codigo_interno: '', descripcion: '', marca_comercial: '', fabricante: '', pais_origen: 'China',
    categoria: 'envase_primario', material_principal: 'PET', nivel_riesgo: 'I', uso_previsto: '',
    capacidad_volumen: '', color: '', numero_registro: '', fecha_registro: '', fecha_vencimiento: '',
    estado: 'borrador', notas: ''
  });

  useEffect(() => {
    if (envase) {
      setFormData({
        codigo_interno: envase.codigo_interno || '', descripcion: envase.descripcion || '',
        marca_comercial: envase.marca_comercial || '', fabricante: envase.fabricante || '',
        pais_origen: envase.pais_origen || 'China', categoria: envase.categoria || 'envase_primario',
        material_principal: envase.material_principal || 'PET', nivel_riesgo: envase.nivel_riesgo || 'I',
        uso_previsto: envase.uso_previsto || '', capacidad_volumen: envase.capacidad_volumen || '',
        color: envase.color || '', numero_registro: envase.numero_registro || '',
        fecha_registro: envase.fecha_registro || '', fecha_vencimiento: envase.fecha_vencimiento || '',
        estado: envase.estado || 'borrador', notas: envase.notas || ''
      });
    }
  }, [envase]);

  const handleMaterialChange = (material: string) => {
    const mat = MATERIALES.find(m => m.value === material);
    setFormData({ ...formData, material_principal: material, nivel_riesgo: mat?.riesgo || 'I' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const data = { cliente_id: clienteId, ...formData, codigo_interno: formData.codigo_interno || null,
      marca_comercial: formData.marca_comercial || null, fabricante: formData.fabricante || null,
      numero_registro: formData.numero_registro || null, fecha_registro: formData.fecha_registro || null,
      fecha_vencimiento: formData.fecha_vencimiento || null, notas: formData.notas || null };
    
    let error;
    if (envase?.id) {
      const result = await supabase.from('envases').update(data).eq('id', envase.id);
      error = result.error;
    } else {
      const result = await supabase.from('envases').insert([data]);
      error = result.error;
    }
    setSaving(false);
    if (!error) onSuccess();
    else alert('Error: ' + error.message);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onClose} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="text-xl font-bold text-slate-800">{envase ? 'Editar Envase' : 'Nuevo Envase'}</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold text-slate-700">Información Básica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción *</label>
              <input type="text" required value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Código Interno</label>
              <input type="text" value={formData.codigo_interno} onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fabricante</label>
              <input type="text" value={formData.fabricante} onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoría *</label>
              <select required value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold text-slate-700">Material</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Material Principal *</label>
              <select required value={formData.material_principal} onChange={(e) => handleMaterialChange(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                {MATERIALES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nivel de Riesgo</label>
              <div className={`px-3 py-2 rounded-lg font-medium ${formData.nivel_riesgo === 'I' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>Riesgo {formData.nivel_riesgo}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
              <input type="text" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold text-slate-700">Registro ANMAT</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                <option value="borrador">Borrador</option>
                <option value="en_tramite">En Trámite</option>
                <option value="vigente">Vigente</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Número de Registro</label>
              <input type="text" value={formData.numero_registro} onChange={(e) => setFormData({ ...formData, numero_registro: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Vencimiento</label>
              <input type="date" value={formData.fecha_vencimiento} onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
