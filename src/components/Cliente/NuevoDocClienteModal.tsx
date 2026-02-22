import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { uploadDocumento, formatFileSize } from '../../lib/storage';
import { DOC_CLIENTE_CATEGORIAS, DOC_CLIENTE_ESTADOS } from '../../lib/constants/estados';
import { DOCS_COMUNES } from '../../lib/constants/enums';
import { X, Upload, Paperclip, Loader2, AlertCircle } from 'lucide-react';

export interface DocumentoCliente {
  id: string;
  nombre: string;
  categoria: string;
  estado: string;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  notas: string | null;
  archivo_path: string | null;
  archivo_nombre: string | null;
  archivo_size: number | null;
  created_at: string;
}

interface NuevoDocClienteModalProps {
  clienteId: string;
  existingDocs: DocumentoCliente[];
  onClose: () => void;
  onCreated: () => void;
}

export default function NuevoDocClienteModal({ clienteId, existingDocs, onClose, onCreated }: NuevoDocClienteModalProps) {
  const [form, setForm] = useState({
    nombre: '', categoria: 'general', estado: 'vigente',
    fecha_emision: '', fecha_vencimiento: '', notas: '',
  });
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');

  const existingNames = existingDocs.map(d => d.nombre.toLowerCase());
  const sugeridos = DOCS_COMUNES.filter(name => !existingNames.includes(name.toLowerCase()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    // Build insert payload
    const payload: Record<string, any> = {
      cliente_id: clienteId,
      nombre: form.nombre,
      categoria: form.categoria,
      estado: form.estado,
      fecha_emision: form.fecha_emision || null,
      fecha_vencimiento: form.fecha_vencimiento || null,
      notas: form.notas || null,
    };

    // Upload file first if selected
    if (selectedFile) {
      const { path, error: uploadErr } = await uploadDocumento(
        `clientes/${clienteId}`,
        selectedFile
      );
      if (uploadErr) {
        setFormError(uploadErr);
        setSaving(false);
        return;
      }
      payload.archivo_path = path;
      payload.archivo_nombre = selectedFile.name;
      payload.archivo_size = selectedFile.size;
    }

    const { error } = await supabase.from('documentos_cliente').insert(payload);

    if (error) {
      // If error is about archivo columns, retry without them
      if (selectedFile && (error.message?.includes('archivo_path') || error.message?.includes('schema cache'))) {
        delete payload.archivo_path;
        delete payload.archivo_nombre;
        delete payload.archivo_size;
        const { error: e2 } = await supabase.from('documentos_cliente').insert(payload);
        if (e2) {
          setFormError(e2.message || 'Error al crear documento.');
          setSaving(false);
          return;
        }
        setFormError('Documento creado pero sin archivo. Ejecute migracion 73 para habilitar archivos.');
        // Still call onCreated after a brief delay so user sees the message
        setTimeout(onCreated, 1500);
        setSaving(false);
        return;
      }
      setFormError(error.message || 'Error al crear documento.');
      setSaving(false);
      return;
    }
    onCreated();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Nuevo Documento del Cliente</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Sugeridos - docs comunes que aun no tiene */}
        {sugeridos.length > 0 && (
          <div className="px-5 pt-4">
            <p className="text-xs font-medium text-slate-500 mb-2">Documentos comunes (click para agregar):</p>
            <div className="flex flex-wrap gap-1.5">
              {sugeridos.map(name => (
                <button
                  key={name}
                  onClick={() => setForm({ ...form, nombre: name })}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    form.nombre === name
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del documento *</label>
            <input required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Constancia de CUIT"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
              <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                {DOC_CLIENTE_CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                {DOC_CLIENTE_ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Emision</label>
              <input type="date" value={form.fecha_emision} onChange={e => setForm({ ...form, fecha_emision: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Vencimiento</label>
              <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
          </div>

          {/* File attachment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Archivo adjunto</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm cursor-pointer hover:bg-slate-100 transition-colors">
                <Upload className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">{selectedFile ? 'Cambiar archivo' : 'Seleccionar archivo'}</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt,.zip,.rar"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                />
              </label>
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                  <span className="text-xs text-slate-400">({formatFileSize(selectedFile.size)})</span>
                  <button type="button" onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
            <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2}
              placeholder="Observaciones..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50">
              {saving ? <><Loader2 className="w-4 h-4 inline mr-1 animate-spin" /> Subiendo...</> : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
