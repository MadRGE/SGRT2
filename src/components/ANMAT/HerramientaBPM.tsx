import { useState } from 'react';
import { Factory, Sparkles, X, Copy, Check, StopCircle, RotateCcw, Download, Loader2, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAnmatAI } from '../../hooks/useAnmatAI';
import { downloadDocx } from '../../lib/markdownToDocx';
import { isOllamaConfigured } from '../../lib/ollama';
import { isAnthropicAvailable } from '../../lib/anthropic';
import type { ChatProvider } from '../../lib/apiKeys';

const TIPOS_ESTABLECIMIENTO = [
  'Fábrica de alimentos',
  'Fraccionadora',
  'Depósito / Almacén',
  'Importador de alimentos',
  'Elaborador de cosméticos',
  'Laboratorio',
  'Otro',
];

const DOCUMENTOS_BPM = [
  { id: 'manual', label: 'Manual de BPM completo' },
  { id: 'poes_recepcion', label: 'POE - Recepción de materias primas' },
  { id: 'poes_almacenamiento', label: 'POE - Almacenamiento' },
  { id: 'poes_proceso', label: 'POE - Proceso productivo' },
  { id: 'poes_envasado', label: 'POE - Envasado y rotulado' },
  { id: 'poes_despacho', label: 'POE - Despacho y distribución' },
  { id: 'sanitizacion', label: 'POES - Limpieza y desinfección' },
  { id: 'higiene', label: 'POES - Higiene del personal' },
  { id: 'mip', label: 'POES - Control de plagas (MIP)' },
  { id: 'residuos', label: 'POES - Manejo de residuos' },
  { id: 'agua', label: 'POES - Control de agua' },
  { id: 'planillas', label: 'Planillas y registros modelo' },
  { id: 'layout', label: 'Descripción de layout / planta' },
  { id: 'flujograma', label: 'Flujograma de proceso' },
  { id: 'capacitacion', label: 'Programa de capacitación' },
];

export function HerramientaBPM() {
  const { output, loading, error, generate, cancel, reset } = useAnmatAI();
  const [copied, setCopied] = useState(false);
  const [provider, setProvider] = useState<ChatProvider>('anthropic');
  const ollamaOk = isOllamaConfigured();
  const anthropicOk = isAnthropicAvailable();

  const [form, setForm] = useState({
    tipoEstablecimiento: '',
    razonSocial: '',
    productos: '',
    descripcionActividad: '',
    selectedDocs: [] as string[],
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleDoc = (docId: string) => {
    setForm(prev => ({
      ...prev,
      selectedDocs: prev.selectedDocs.includes(docId)
        ? prev.selectedDocs.filter(d => d !== docId)
        : [...prev.selectedDocs, docId],
    }));
  };

  const selectAll = () => {
    setForm(prev => ({
      ...prev,
      selectedDocs: prev.selectedDocs.length === DOCUMENTOS_BPM.length
        ? []
        : DOCUMENTOS_BPM.map(d => d.id),
    }));
  };

  const handleGenerate = () => {
    const parts: string[] = [];
    if (form.tipoEstablecimiento) parts.push(`Tipo de establecimiento: ${form.tipoEstablecimiento}`);
    if (form.razonSocial) parts.push(`Razón social: ${form.razonSocial}`);
    if (form.productos) parts.push(`Productos que elabora/fracciona:\n${form.productos}`);
    if (form.descripcionActividad) parts.push(`Descripción de la actividad:\n${form.descripcionActividad}`);

    const selectedLabels = form.selectedDocs
      .map(id => DOCUMENTOS_BPM.find(d => d.id === id)?.label)
      .filter(Boolean);

    if (selectedLabels.length > 0) {
      parts.push(`Documentos solicitados:\n${selectedLabels.map(l => `- ${l}`).join('\n')}`);
    }

    const userMessage = parts.length > 0
      ? `Generá la documentación BPM para RNE con los siguientes datos:\n\n${parts.join('\n\n')}`
      : 'Generá un template completo de Manual BPM para un establecimiento alimentario genérico.';

    generate('bpm-rne', userMessage, provider);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    reset();
    setForm({ tipoEstablecimiento: '', razonSocial: '', productos: '', descripcionActividad: '', selectedDocs: [] });
  };

  const showResult = output || loading || error;

  return (
    <div className="space-y-6">
      {!showResult ? (
        <>
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">BPM para RNE</h3>
              <p className="text-xs text-slate-500">Documentación para Registro Nacional de Establecimiento</p>
            </div>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de establecimiento</label>
              <select
                value={form.tipoEstablecimiento}
                onChange={e => handleChange('tipoEstablecimiento', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Seleccionar...</option>
                {TIPOS_ESTABLECIMIENTO.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Razón social</label>
              <input
                type="text"
                value={form.razonSocial}
                onChange={e => handleChange('razonSocial', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ej: Alimentos del Sur S.R.L."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Productos que elabora / fracciona</label>
              <textarea
                value={form.productos}
                onChange={e => handleChange('productos', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ej: Galletitas, snacks, productos de panadería..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción de la actividad</label>
              <textarea
                value={form.descripcionActividad}
                onChange={e => handleChange('descripcionActividad', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Describí brevemente el proceso productivo, instalaciones, equipamiento..."
              />
            </div>
          </div>

          {/* Document selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">Documentos a generar</label>
              <button onClick={selectAll} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                {form.selectedDocs.length === DOCUMENTOS_BPM.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {DOCUMENTOS_BPM.map(doc => (
                <label
                  key={doc.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                    form.selectedDocs.includes(doc.id)
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.selectedDocs.includes(doc.id)}
                    onChange={() => toggleDoc(doc.id)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  {doc.label}
                </label>
              ))}
            </div>
          </div>

          {/* Provider toggle + Generate button */}
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => setProvider('anthropic')}
                disabled={!anthropicOk}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  provider === 'anthropic'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                Claude
              </button>
              <button
                onClick={() => setProvider('ollama')}
                disabled={!ollamaOk}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  provider === 'ollama'
                    ? 'bg-white text-green-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                Ollama
              </button>
            </div>
            <button
              onClick={handleGenerate}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg font-semibold text-sm hover:from-emerald-700 hover:to-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="w-4 h-4" />
              Generar Documentación BPM
            </button>
          </div>
          {provider === 'ollama' && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Los modelos locales pueden generar resultados de menor calidad que Claude.
            </p>
          )}
        </>
      ) : (
        <>
          {/* Result header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                <Factory className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">BPM para RNE</h3>
                {loading && (
                  <p className="text-xs text-emerald-600 animate-pulse flex items-center gap-1 mt-0.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generando documento...
                  </p>
                )}
                {output && !loading && (
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                    <Check className="w-3 h-3" />
                    Documento generado — descargá o copiá
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {loading && (
                <button onClick={cancel} className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 flex items-center gap-1.5" title="Detener">
                  <StopCircle className="w-4 h-4" />
                  Detener
                </button>
              )}
              <button onClick={handleReset} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600" title="Nuevo documento">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={handleReset} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600" title="Cerrar">
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
            <>
              {/* Action buttons */}
              {!loading && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
                  <button
                    onClick={() => downloadDocx(output, `BPM_RNE_${form.razonSocial || 'Documento'}`.replace(/\s+/g, '_'))}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Descargar Word (.docx)
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 bg-white text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado' : 'Copiar texto'}
                  </button>
                </div>
              )}

              {/* Document preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">Vista previa del documento</span>
                </div>
                <div className="bg-white p-8 overflow-auto max-h-[70vh] prose prose-sm prose-slate max-w-none
                  prose-headings:text-slate-800 prose-h1:text-xl prose-h1:text-center prose-h1:border-b prose-h1:pb-3 prose-h1:mb-4
                  prose-h2:text-lg prose-h2:mt-6 prose-h3:text-base
                  prose-table:border-collapse prose-th:bg-slate-100 prose-th:border prose-th:border-slate-300 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-xs prose-th:font-semibold
                  prose-td:border prose-td:border-slate-200 prose-td:px-3 prose-td:py-2 prose-td:text-sm
                  prose-strong:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
