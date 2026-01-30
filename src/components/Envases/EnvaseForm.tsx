import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';

interface Props {
  empresaId: string;
  envase?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIAS = [
  { value: 'envase_primario', label: 'Envase Primario' },
  { value: 'envase_secundario', label: 'Envase Secundario' },
  { value: 'tapa_cierre', label: 'Tapa/Cierre' },
  { value: 'film_flexible', label: 'Film Flexible' },
  { value: 'bandeja', label: 'Bandeja' },
  { value: 'botella', label: 'Botella' },
  { value: 'frasco', label: 'Frasco' },
  { value: 'sachet', label: 'Sachet' },
  { value: 'otro', label: 'Otro' }
];

const MATERIALES = [
  { value: 'PET', label: 'PET - Polietileno Tereftalato', riesgo: 'I' },
  { value: 'PEAD', label: 'PEAD - Polietileno Alta Densidad', riesgo: 'I' },
  { value: 'PEBD', label: 'PEBD - Polietileno Baja Densidad', riesgo: 'I' },
  { value: 'PP', label: 'PP - Polipropileno', riesgo: 'I' },
  { value: 'PS', label: 'PS - Poliestireno', riesgo: 'I' },
  { value: 'PVC', label: 'PVC - Policloruro de Vinilo', riesgo: 'II' },
  { value: 'PA', label: 'PA - Poliamida/Nylon', riesgo: 'II' },
  { value: 'EVOH', label: 'EVOH - Etileno Vinil Alcohol', riesgo: 'II' },
  { value: 'Vidrio', label: 'Vidrio', riesgo: 'I' },
  { value: 'Aluminio', label: 'Aluminio', riesgo: 'I' },
  { value: 'Hojalata', label: 'Hojalata', riesgo: 'I' },
  { value: 'Carton', label: 'Carton', riesgo: 'I' },
  { value: 'Papel', label: 'Papel', riesgo: 'I' },
  { value: 'Multicapa', label: 'Multicapa/Laminado', riesgo: 'II' },
  { value: 'Otro', label: 'Otro', riesgo: 'II' }
];

const ESTADOS = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'en_tramite', label: 'En Tramite' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'vigente', label: 'Vigente' },
  { value: 'por_vencer', label: 'Por Vencer' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'rechazado', label: 'Rechazado' }
];

export default function EnvaseForm({ empresaId, envase, onClose, onSuccess }: Props) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    codigo_interno: '',
    descripcion: '',
    marca_comercial: '',
    fabricante: '',
    pais_origen: 'China',
    categoria: 'envase_primario',
    material_principal: 'PET',
    nivel_riesgo: 'I',
    uso_previsto: '',
    capacidad_volumen: '',
    dimensiones: '',
    color: '',
    temperatura_max: '',
    temperatura_min: '',
    apto_microondas: false,
    apto_congelado: false,
    apto_lavavajillas: false,
    contacto_directo: true,
    numero_registro: '',
    fecha_registro: '',
    fecha_vencimiento: '',
    estado: 'borrador',
    notas: ''
  });

  useEffect(() => {
    if (envase) {
      setFormData({
        codigo_interno: envase.codigo_interno || '',
        descripcion: envase.descripcion || '',
        marca_comercial: envase.marca_comercial || '',
        fabricante: envase.fabricante || '',
        pais_origen: envase.pais_origen || 'China',
        categoria: envase.categoria || 'envase_primario',
        material_principal: envase.material_principal || 'PET',
        nivel_riesgo: envase.nivel_riesgo || 'I',
        uso_previsto: envase.uso_previsto || '',
        capacidad_volumen: envase.capacidad_volumen || '',
        dimensiones: envase.dimensiones || '',
        color: envase.color || '',
        temperatura_max: envase.temperatura_max?.toString() || '',
        temperatura_min: envase.temperatura_min?.toString() || '',
        apto_microondas: envase.apto_microondas || false,
        apto_congelado: envase.apto_congelado || false,
        apto_lavavajillas: envase.apto_lavavajillas || false,
        contacto_directo: envase.contacto_directo ?? true,
        numero_registro: envase.numero_registro || '',
        fecha_registro: envase.fecha_registro || '',
        fecha_vencimiento: envase.fecha_vencimiento || '',
        estado: envase.estado || 'borrador',
        notas: envase.notas || ''
      });
    }
  }, [envase]);

  const handleMaterialChange = (material: string) => {
    const mat = MATERIALES.find(m => m.value === material);
    setFormData({
      ...formData,
      material_principal: material,
      nivel_riesgo: mat?.riesgo || 'I'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      empresa_id: empresaId,
      codigo_interno: formData.codigo_interno || null,
      descripcion: formData.descripcion,
      marca_comercial: formData.marca_comercial || null,
      fabricante: formData.fabricante || null,
      pais_origen: formData.pais_origen || null,
      categoria: formData.categoria,
      material_principal: formData.material_principal,
      nivel_riesgo: formData.nivel_riesgo,
      uso_previsto: formData.uso_previsto || null,
      capacidad_volumen: formData.capacidad_volumen || null,
      dimensiones: formData.dimensiones || null,
      color: formData.color || null,
      temperatura_max: formData.temperatura_max ? parseFloat(formData.temperatura_max) : null,
      temperatura_min: formData.temperatura_min ? parseFloat(formData.temperatura_min) : null,
      apto_microondas: formData.apto_microondas,
      apto_congelado: formData.apto_congelado,
      apto_lavavajillas: formData.apto_lavavajillas,
      contacto_directo: formData.contacto_directo,
      numero_registro: formData.numero_registro || null,
      fecha_registro: formData.fecha_registro || null,
      fecha_vencimiento: formData.fecha_vencimiento || null,
      estado: formData.estado,
      notas: formData.notas || null
    };

    let error;
    if (envase?.id) {
      const result = await supabase.from('envases').update(data).eq('id', envase.id);
      error = result.error;
    } else {
      const result = await supabase.from('envases').insert([data]);
      error = result.error;
    }

    setSaving(false);

    if (!error) {
      onSuccess();
    } else {
      alert('Error al guardar: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onClose}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">
          {envase ? 'Editar Envase' : 'Nuevo Envase'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informacion basica */}
        <div className="bg-slate-50 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold text-slate-700">Informacion Basica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descripcion *
              </label>
              <input
                type="text"
                required
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Ej: Botella PET 500ml transparente"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Codigo Interno
              </label>
              <input
                type="text"
                value={formData.codigo_interno}
                onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value })}
                placeholder="Ej: ENV-001"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Marca Comercial
              </label>
              <input
                type="text"
                value={formData.marca_comercial}
                onChange={(e) => setFormData({ ...formData, marca_comercial: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fabricante
              </label>
              <input
                type="text"
                value={formData.fabricante}
                onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Pais de Origen
              </label>
              <input
                type="text"
                value={formData.pais_origen}
                onChange={(e) => setFormData({ ...formData, pais_origen: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Categoria *
              </label>
              <select
                required
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIAS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Material y Riesgo */}
        <div className="bg-slate-50 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold text-slate-700">Material y Clasificacion</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Material Principal *
              </label>
              <select
                required
                value={formData.material_principal}
                onChange={(e) => handleMaterialChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MATERIALES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nivel de Riesgo
              </label>
              <div className={`px-3 py-2 rounded-lg font-medium ${
                formData.nivel_riesgo === 'I' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                Riesgo {formData.nivel_riesgo}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Color
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Ej: Transparente, Blanco, etc."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Especificaciones */}
        <div className="bg-slate-50 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold text-slate-700">Especificaciones</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Capacidad/Volumen
              </label>
              <input
                type="text"
                value={formData.capacidad_volumen}
                onChange={(e) => setFormData({ ...formData, capacidad_volumen: e.target.value })}
                placeholder="Ej: 500ml, 1L, 250g"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Dimensiones
              </label>
              <input
                type="text"
                value={formData.dimensiones}
                onChange={(e) => setFormData({ ...formData, dimensiones: e.target.value })}
                placeholder="Ej: 20x10x5 cm"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Uso Previsto
              </label>
              <input
                type="text"
                value={formData.uso_previsto}
                onChange={(e) => setFormData({ ...formData, uso_previsto: e.target.value })}
                placeholder="Ej: Bebidas, lacteos, etc."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.contacto_directo}
                onChange={(e) => setFormData({ ...formData, contacto_directo: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Contacto directo con alimento</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.apto_microondas}
                onChange={(e) => setFormData({ ...formData, apto_microondas: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Apto microondas</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.apto_congelado}
                onChange={(e) => setFormData({ ...formData, apto_congelado: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Apto congelado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.apto_lavavajillas}
                onChange={(e) => setFormData({ ...formData, apto_lavavajillas: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Apto lavavajillas</span>
            </label>
          </div>
        </div>

        {/* Registro */}
        <div className="bg-slate-50 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold text-slate-700">Registro ANMAT</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Estado
              </label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ESTADOS.map(e => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Numero de Registro
              </label>
              <input
                type="text"
                value={formData.numero_registro}
                onChange={(e) => setFormData({ ...formData, numero_registro: e.target.value })}
                placeholder="Ej: RNPUD-XXX"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha Registro
              </label>
              <input
                type="date"
                value={formData.fecha_registro}
                onChange={(e) => setFormData({ ...formData, fecha_registro: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha Vencimiento
              </label>
              <input
                type="date"
                value={formData.fecha_vencimiento}
                onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Notas
          </label>
          <textarea
            value={formData.notas}
            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
