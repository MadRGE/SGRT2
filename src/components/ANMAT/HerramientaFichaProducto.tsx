import { useState } from 'react';
import { ClipboardList, Sparkles, X, Copy, Check, StopCircle, RotateCcw } from 'lucide-react';
import { useAnmatAI } from '../../hooks/useAnmatAI';

const CLASIFICACIONES = [
  'Alimento',
  'Suplemento dietario',
  'Envase / Material en contacto con alimentos',
  'Cosmético',
  'Producto de higiene',
  'Producto médico',
  'Otro',
];

export function HerramientaFichaProducto() {
  const { output, loading, error, generate, cancel, reset } = useAnmatAI();
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    marca: '',
    clasificacion: '',
    composicion: '',
    paisOrigen: '',
    fabricante: '',
    usoPrevisto: '',
    observaciones: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = () => {
    const parts: string[] = [];
    if (form.nombre) parts.push(`Nombre del producto: ${form.nombre}`);
    if (form.marca) parts.push(`Marca: ${form.marca}`);
    if (form.clasificacion) parts.push(`Clasificación: ${form.clasificacion}`);
    if (form.composicion) parts.push(`Composición / Materiales:\n${form.composicion}`);
    if (form.paisOrigen) parts.push(`País de origen: ${form.paisOrigen}`);
    if (form.fabricante) parts.push(`Fabricante: ${form.fabricante}`);
    if (form.usoPrevisto) parts.push(`Uso previsto: ${form.usoPrevisto}`);
    if (form.observaciones) parts.push(`Observaciones adicionales: ${form.observaciones}`);

    const userMessage = parts.length > 0
      ? `Generá una ficha técnica de producto completa con los siguientes datos:\n\n${parts.join('\n\n')}`
      : 'Generá una ficha técnica de producto genérica como template para completar.';

    generate('ficha-producto', userMessage);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    reset();
    setForm({ nombre: '', marca: '', clasificacion: '', composicion: '', paisOrigen: '', fabricante: '', usoPrevisto: '', observaciones: '' });
  };

  const showResult = output || loading || error;

  return (
    <div className="space-y-6">
      {!showResult ? (
        <>
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Ficha de Producto</h3>
              <p className="text-xs text-slate-500">Completá los datos que tengas, la IA genera el resto</p>
            </div>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del producto</label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => handleChange('nombre', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Galletitas de arroz sabor original"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
              <input
                type="text"
                value={form.marca}
                onChange={e => handleChange('marca', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: NaturSnack"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Clasificación</label>
              <select
                value={form.clasificacion}
                onChange={e => handleChange('clasificacion', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar...</option>
                {CLASIFICACIONES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">País de origen</label>
              <input
                type="text"
                value={form.paisOrigen}
                onChange={e => handleChange('paisOrigen', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: China, Brasil, Argentina"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Fabricante</label>
              <input
                type="text"
                value={form.fabricante}
                onChange={e => handleChange('fabricante', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Shenzhen Foods Co. Ltd."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Composición / Materiales</label>
              <textarea
                value={form.composicion}
                onChange={e => handleChange('composicion', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Listá ingredientes, materiales, aditivos..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Uso previsto</label>
              <input
                type="text"
                value={form.usoPrevisto}
                onChange={e => handleChange('usoPrevisto', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Consumo humano directo, envase para alimentos..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones adicionales</label>
              <textarea
                value={form.observaciones}
                onChange={e => handleChange('observaciones', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Cualquier info extra relevante..."
              />
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Sparkles className="w-4 h-4" />
            Generar Ficha de Producto
          </button>
        </>
      ) : (
        <>
          {/* Result view */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-slate-800">Ficha de Producto</h3>
              {loading && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700 animate-pulse">
                  Generando...
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {loading && (
                <button onClick={cancel} className="p-2 hover:bg-red-50 rounded-lg text-red-500" title="Detener">
                  <StopCircle className="w-4 h-4" />
                </button>
              )}
              {output && !loading && (
                <button onClick={handleCopy} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500" title="Copiar">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
              <button onClick={handleReset} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500" title="Nueva ficha">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={handleReset} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500" title="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {output && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 prose prose-sm prose-slate max-w-none overflow-auto max-h-[70vh] whitespace-pre-wrap">
              {output}
            </div>
          )}
        </>
      )}
    </div>
  );
}
