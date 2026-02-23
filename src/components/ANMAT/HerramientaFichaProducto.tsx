import { useState, useRef } from 'react';
import { ClipboardList, Sparkles, X, Copy, Check, StopCircle, RotateCcw, Upload, Loader2, Camera, MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useAnmatAI } from '../../hooks/useAnmatAI';
import { analyzeProductImages, chatWithImages, isGeminiAvailable } from '../../lib/geminiVision';

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

  // Image upload state
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat with AI state
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (newFiles.length === 0) return;

    const allFiles = [...images, ...newFiles].slice(0, 5); // max 5
    setImages(allFiles);

    // Generate previews
    const previews = allFiles.map(f => URL.createObjectURL(f));
    // Revoke old previews
    imagePreviews.forEach(p => URL.revokeObjectURL(p));
    setImagePreviews(previews);
    setAnalyzed(false);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setAnalyzed(false);
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;
    setAnalyzing(true);
    setAnalyzeError('');

    try {
      const data = await analyzeProductImages(images);
      setForm(prev => ({
        nombre: data.nombre || prev.nombre,
        marca: data.marca || prev.marca,
        clasificacion: data.clasificacion || prev.clasificacion,
        composicion: data.composicion || prev.composicion,
        paisOrigen: data.paisOrigen || prev.paisOrigen,
        fabricante: data.fabricante || prev.fabricante,
        usoPrevisto: data.usoPrevisto || prev.usoPrevisto,
        observaciones: data.observaciones || prev.observaciones,
      }));
      setAnalyzed(true);
    } catch (err: any) {
      setAnalyzeError(err.message || 'Error al analizar las imágenes');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChat = async () => {
    if (!chatPrompt.trim() || images.length === 0) return;
    setChatLoading(true);
    setChatError('');
    setChatResponse('');

    try {
      const response = await chatWithImages(images, chatPrompt.trim());
      setChatResponse(response);
    } catch (err: any) {
      setChatError(err.message || 'Error al consultar la IA');
    } finally {
      setChatLoading(false);
    }
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
    imagePreviews.forEach(p => URL.revokeObjectURL(p));
    setImages([]);
    setImagePreviews([]);
    setAnalyzed(false);
    setAnalyzeError('');
    setForm({ nombre: '', marca: '', clasificacion: '', composicion: '', paisOrigen: '', fabricante: '', usoPrevisto: '', observaciones: '' });
    setChatPrompt('');
    setChatResponse('');
    setChatError('');
    setChatOpen(false);
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
              <p className="text-xs text-slate-500">Subí fotos del producto o completá los datos manualmente</p>
            </div>
          </div>

          {/* Image Upload Zone */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-dashed border-blue-300 rounded-xl p-5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={e => handleFilesSelected(e.target.files)}
              className="hidden"
            />

            {images.length === 0 ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-3 py-4"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Camera className="w-7 h-7 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-blue-800">Subí fotos del producto</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Etiquetas, packaging, rótulos, certificados - la IA extrae los datos automáticamente
                  </p>
                </div>
              </button>
            ) : (
              <div className="space-y-4">
                {/* Image previews */}
                <div className="flex gap-3 flex-wrap">
                  {imagePreviews.map((preview, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={preview}
                        alt={`Imagen ${i + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border-2 border-white shadow-sm"
                      />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="text-[10px] mt-1">Agregar</span>
                    </button>
                  )}
                </div>

                {/* Analyze button */}
                <div className="flex items-center gap-3">
                  {isGeminiAvailable() ? (
                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium text-sm hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 shadow-sm"
                    >
                      {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {analyzing ? 'Analizando...' : 'Analizar imágenes con IA'}
                    </button>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Análisis con IA no disponible — completá los datos manualmente abajo</p>
                  )}
                  {analyzed && (
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Datos extraídos - revisá abajo
                    </span>
                  )}
                </div>

                {/* Chat with AI about images */}
                {isGeminiAvailable() && (
                  <div className="border-t border-blue-200 pt-3">
                    <button
                      onClick={() => setChatOpen(!chatOpen)}
                      className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Consultá a la IA sobre las imágenes
                      {chatOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {chatOpen && (
                      <div className="mt-3 space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={chatPrompt}
                            onChange={e => setChatPrompt(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !chatLoading && handleChat()}
                            placeholder="Ej: ¿Cuál es el código de barras? / Generame una descripción comercial"
                            className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={chatLoading}
                          />
                          <button
                            onClick={handleChat}
                            disabled={chatLoading || !chatPrompt.trim()}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </button>
                        </div>

                        {chatError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{chatError}</div>
                        )}

                        {chatResponse && (
                          <div className="p-4 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 whitespace-pre-wrap max-h-60 overflow-auto">
                            {chatResponse}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {analyzeError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{analyzeError}</div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-xs text-slate-400 font-medium">Datos del producto</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del producto</label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => handleChange('nombre', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${analyzed && form.nombre ? 'border-green-300 bg-green-50/50' : 'border-slate-300'}`}
                placeholder="Ej: Galletitas de arroz sabor original"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
              <input
                type="text"
                value={form.marca}
                onChange={e => handleChange('marca', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${analyzed && form.marca ? 'border-green-300 bg-green-50/50' : 'border-slate-300'}`}
                placeholder="Ej: NaturSnack"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Clasificación</label>
              <select
                value={form.clasificacion}
                onChange={e => handleChange('clasificacion', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${analyzed && form.clasificacion ? 'border-green-300 bg-green-50/50' : 'border-slate-300'}`}
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
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${analyzed && form.paisOrigen ? 'border-green-300 bg-green-50/50' : 'border-slate-300'}`}
                placeholder="Ej: China, Brasil, Argentina"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Fabricante</label>
              <input
                type="text"
                value={form.fabricante}
                onChange={e => handleChange('fabricante', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${analyzed && form.fabricante ? 'border-green-300 bg-green-50/50' : 'border-slate-300'}`}
                placeholder="Ej: Shenzhen Foods Co. Ltd."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Composición / Materiales</label>
              <textarea
                value={form.composicion}
                onChange={e => handleChange('composicion', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${analyzed && form.composicion ? 'border-green-300 bg-green-50/50' : 'border-slate-300'}`}
                placeholder="Listá ingredientes, materiales, aditivos..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Uso previsto</label>
              <input
                type="text"
                value={form.usoPrevisto}
                onChange={e => handleChange('usoPrevisto', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${analyzed && form.usoPrevisto ? 'border-green-300 bg-green-50/50' : 'border-slate-300'}`}
                placeholder="Ej: Consumo humano directo, envase para alimentos..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones adicionales</label>
              <textarea
                value={form.observaciones}
                onChange={e => handleChange('observaciones', e.target.value)}
                rows={2}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${analyzed && form.observaciones ? 'border-green-300 bg-green-50/50' : 'border-slate-300'}`}
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
