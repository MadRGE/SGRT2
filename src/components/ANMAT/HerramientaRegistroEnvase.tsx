import { useState, useEffect, useRef } from 'react';
import {
  Package, Upload, Trash2, Eye, Download, FileText,
  AlertTriangle, Loader2,
  Hammer, Play, Clock, CheckCircle, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getMaterialsList, uploadAndParse, generateFicha, listFichas,
  getHammerProceduresForOrganismo, executeHammer,
  getHammerEjecucionesForTramite, createTramite, addProductosToTramite,
  addFichaToTramite, createSolicitud, generateSolicitudData,
  getClients, getFichaPdfUrl, checkBackendHealth,
  type Material, type HammerProcedure, type HammerEjecucion, type Client,
} from '../../services/InalApiService';

// ─── Types ───
interface ProductPart {
  name: string;
  classification: string;
  material: string;
  materialCode: string;
  foodContact: boolean;
}

interface Product {
  id: string;
  itemNo: string;
  name: string;
  description: string;
  materialCode: string;
  brand: string;
  colors: string;
  models: string;
  parts: ProductPart[];
  selected: boolean;
}

interface FichaRecord {
  id: string;
  item_number: string;
  brand: string;
  pdf_path: string;
  created_at: string;
}

interface Props {
  clienteId?: string;
  onBack?: () => void;
}

export function HerramientaRegistroEnvase({ clienteId: _clienteId, onBack }: Props) {
  const [step, setStep] = useState<'upload' | 'products' | 'ficha' | 'solicitud' | 'hammer'>('upload');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingParts, setEditingParts] = useState<ProductPart[]>([]);
  const [fichas, setFichas] = useState<FichaRecord[]>([]);
  const [ejecuciones, setEjecuciones] = useState<HammerEjecucion[]>([]);
  const [hammerProcs, setHammerProcs] = useState<HammerProcedure[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [tramiteId, setTramiteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [backendOk, setBackendOk] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mfr, setMfr] = useState({
    nombre: '', direccion: '', telefono: '', email: '', pais: 'China'
  });

  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  // ─── Init ───
  useEffect(() => {
    init();
  }, []);

  async function init() {
    const healthy = await checkBackendHealth();
    setBackendOk(healthy);
    if (!healthy) {
      toast.error('Backend INAL no disponible. Ejecutá: python app.py');
      return;
    }
    const [mats, cls, procs] = await Promise.all([
      getMaterialsList(),
      getClients(),
      getHammerProceduresForOrganismo('INAL'),
    ]);
    setMaterials(mats);
    setClients(cls);
    setHammerProcs(procs);
  }

  // ─── File Upload ───
  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const data = await uploadAndParse(file);
      if (data.count === 0) {
        toast.error('No se encontraron productos en el archivo');
        return;
      }
      const parsed: Product[] = data.products.map(p => ({
        id: p.id,
        itemNo: p.item_no || '',
        name: p.name || '',
        description: p.description || p.name || '',
        materialCode: p.material_code || '',
        brand: p.brand || '',
        colors: p.colors || '',
        models: p.item_no || '',
        parts: p.material_code ? [{
          name: 'Cuerpo',
          classification: materials.find(m => m.codigo === p.material_code)?.clasificacion_anmat || '',
          material: materials.find(m => m.codigo === p.material_code)?.nombre || p.material_name || '',
          materialCode: p.material_code,
          foodContact: true,
        }] : [],
        selected: false,
      }));
      setProducts(parsed);
      setStep('products');

      // Create tramite for tracking
      const tramite = await createTramite({
        tipo: 'registro_envase',
        estado: 'intake',
        cliente: selectedClient,
        fabricante: mfr,
      });
      setTramiteId(tramite.id);
      await addProductosToTramite(tramite.id, parsed);

      toast.success(`${data.count} productos cargados`);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar archivo');
    } finally {
      setUploading(false);
    }
  }

  // ─── Product editing ───
  function startEdit(idx: number) {
    setEditingIdx(idx);
    const p = products[idx];
    setEditingParts(p.parts.length ? [...p.parts] : [{
      name: 'Cuerpo', classification: '', material: '', materialCode: '', foodContact: true
    }]);
  }

  function saveEdit() {
    if (editingIdx === null) return;
    const updated = [...products];
    updated[editingIdx].parts = [...editingParts];
    if (editingParts.length && editingParts[0].materialCode) {
      updated[editingIdx].materialCode = editingParts[0].materialCode;
    }
    setProducts(updated);
    setEditingIdx(null);
    toast.success('Producto actualizado');
  }

  function updatePart(idx: number, code: string) {
    const mat = materials.find(m => m.codigo === code);
    const updated = [...editingParts];
    updated[idx] = {
      ...updated[idx],
      materialCode: code,
      material: mat?.nombre || '',
      classification: mat?.clasificacion_anmat || '',
    };
    setEditingParts(updated);
  }

  // ─── Ficha generation ───
  async function doGenerateFicha(product: Product) {
    const mat = materials.find(m => m.codigo === product.materialCode);
    const fichaData = {
      item_number: product.itemNo,
      description: product.description || product.name,
      brand: product.brand || '-',
      colors: product.colors || '-',
      models: product.models || product.itemNo,
      proportions: '-',
      origin: mfr.pais.toUpperCase() || 'CHINA',
      date: new Date().toLocaleDateString('es-AR'),
      manufacturer: { name: mfr.nombre, address: mfr.direccion, phone: mfr.telefono, email: mfr.email },
      temperatures: {
        min: String(mat?.temp_min ?? -20),
        max: String(mat?.temp_max ?? 120),
        ambient: String(mat?.temp_ambiente ?? 24),
      },
      food_types: mat?.alimentos || ['Non-acidic aqueous food (pH > 4.5)', 'Fatty foods'],
      parts: product.parts.map(p => ({
        name: p.name, classification: p.classification, material: p.material, food_contact: p.foodContact,
      })),
      uses: ['TO USE', 'TO CONSERVATE', 'REPEATABLE',
        ...(mat?.microondas ? ['MICROWAVE SAFE'] : []),
        ...(mat?.lavavajillas ? ['DISHWASHER SAFE'] : []),
      ],
    };

    try {
      let result;
      if (tramiteId) {
        result = await addFichaToTramite(tramiteId, fichaData);
      } else {
        result = await generateFicha(fichaData);
      }
      toast.success(`Ficha ${product.itemNo} generada`);
      window.open(getFichaPdfUrl(result.id), '_blank');
      loadFichas();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  }

  async function generateAllFichas() {
    setLoading(true);
    for (const p of products) {
      await doGenerateFicha(p);
    }
    setLoading(false);
  }

  async function loadFichas() {
    const all = await listFichas();
    setFichas(all.map((f: any) => ({
      id: f.id,
      item_number: f.item_number || '',
      brand: f.brand || '',
      pdf_path: getFichaPdfUrl(f.id),
      created_at: f.date || '',
    })));
  }

  // ─── Solicitud ───
  async function doGenerateSolicitud() {
    const client = selectedClient || { cuit: '', razon_social: '', provincia: '', localidad: '', calle: '', telefono: '', email: '' };
    const solData = await generateSolicitudData({
      products: products.map(p => ({
        item_no: p.itemNo,
        description: p.description,
        brand: p.brand,
        parts: p.parts.map(pt => ({ classification: pt.classification, material: pt.material, food_contact: pt.foodContact })),
      })),
      client: { cuit: client.cuit, razon_social: client.razon_social, provincia: client.provincia, localidad: client.localidad, calle: client.calle, telefono: client.telefono, email: client.email },
      manufacturer: { name: mfr.nombre, address: mfr.direccion, country: mfr.pais, state: '', email: mfr.email },
    });

    await createSolicitud({ ...solData, tramite_id: tramiteId });
    toast.success('Solicitud TAD generada');
    return solData;
  }

  // ─── Hammer ───
  async function launchHammer(procId: string) {
    try {
      await executeHammer({ tramite_id: tramiteId || undefined, tipo_tramite: 'registro_envase', procedimiento: procId });
      toast.success('Hammer ejecutando');
      if (tramiteId) {
        const ejecs = await getHammerEjecucionesForTramite(tramiteId);
        setEjecuciones(ejecs);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  }

  // ─── Preview ───
  function renderFichaPreview(product: Product) {
    const mat = materials.find(m => m.codigo === product.materialCode);
    const temps = mat ? { min: mat.temp_min, max: mat.temp_max, amb: mat.temp_ambiente } : { min: -20, max: 120, amb: 24 };
    const foods = mat?.alimentos || ['Non-acidic aqueous food (pH > 4.5)', 'Fatty foods'];
    const uses = ['TO USE', 'TO CONSERVATE', 'REPEATABLE', ...(mat?.microondas ? ['MICROWAVE SAFE'] : []), ...(mat?.lavavajillas ? ['DISHWASHER SAFE'] : [])];

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 font-serif text-slate-900 text-sm leading-relaxed max-h-[600px] overflow-y-auto">
        <h3 className="text-center font-bold text-base border-b-2 border-slate-800 pb-2 mb-4">
          PRODUCT CERTIFICATE / MANUFACTURER'S DECLARATION
        </h3>
        <div className="text-center mb-4">
          <p className="font-bold">{mfr.nombre || '[FABRICANTE]'}</p>
          <p className="text-xs text-slate-500">{mfr.direccion || '[DIRECCION]'}</p>
          <p className="text-xs text-slate-500">Tel: {mfr.telefono} Email: {mfr.email}</p>
        </div>
        <div className="bg-slate-50 border-l-4 border-slate-400 p-3 mb-4 italic text-xs">
          We declare that: The Material used to elaborate all the products is 100% virgin, it's not second-hand material.<br />
          <span className="text-slate-500">El material utilizado para elaborar todos los productos es 100% virgen, no es material de segunda mano.</span>
        </div>
        {([
          ['ITEM NUMBER', product.itemNo],
          ['DESCRIPTION', product.description || product.name],
          ['BRAND', product.brand || '⚠ COMPLETAR'],
          ['COLORS', product.colors || '⚠ COMPLETAR'],
          ['MODELS/SKUs', product.models || product.itemNo],
        ] as [string, string][]).map(([label, value], i) => (
          <div key={i} className="flex gap-2 py-1 border-b border-dotted border-slate-200">
            <span className="font-bold min-w-[140px] text-slate-700">{label}:</span>
            <span>{value}</span>
          </div>
        ))}
        <div className="flex gap-2 py-1 border-b border-dotted border-slate-200">
          <span className="font-bold min-w-[140px] text-slate-700">TEMPERATURE:</span>
          <span>REFRIGERATED: {temps.min}°C &nbsp; HOT: {temps.max}°C &nbsp; AMBIENT: {temps.amb}°C</span>
        </div>
        <div className="py-2">
          <span className="font-bold text-slate-700">TYPE OF FOOD:</span>
          <ul className="ml-4 mt-1">{foods.map((f, i) => <li key={i} className="text-xs">• {f}</li>)}</ul>
        </div>
        <div className="py-2">
          <span className="font-bold text-slate-700">COMPOSITION:</span>
          {product.parts.length > 0 ? (
            <table className="w-full mt-2 text-xs border-collapse">
              <thead><tr className="bg-slate-800 text-white">
                <th className="px-2 py-1 text-left">Part</th><th className="px-2 py-1 text-left">Classification</th>
                <th className="px-2 py-1 text-left">Material</th><th className="px-2 py-1 text-left">Food Contact</th>
              </tr></thead>
              <tbody>{product.parts.map((p, i) => (
                <tr key={i} className={i % 2 ? 'bg-slate-50' : ''}>
                  <td className="px-2 py-1 border border-slate-200">{p.name || '⚠'}</td>
                  <td className="px-2 py-1 border border-slate-200">{p.classification || '⚠'}</td>
                  <td className="px-2 py-1 border border-slate-200">{p.material || '⚠'}</td>
                  <td className="px-2 py-1 border border-slate-200">{p.foodContact ? 'Sí' : 'No'}</td>
                </tr>
              ))}</tbody>
            </table>
          ) : <p className="text-red-500 text-xs mt-1">Sin piezas definidas</p>}
        </div>
        <div className="flex gap-2 py-1"><span className="font-bold text-slate-700">USE:</span><span className="text-xs">{uses.join(' | ')}</span></div>
        <div className="flex justify-between mt-4 pt-2 border-t-2 border-slate-800 font-bold">
          <span>Origin: {mfr.pais.toUpperCase() || 'CHINA'}</span>
          <span>Date: {new Date().toLocaleDateString('es-AR')}</span>
        </div>
        <div className="mt-4 text-center p-4 border border-dashed border-slate-300 text-slate-400 italic text-xs">[FIRMA]</div>
      </div>
    );
  }

  // ─── Render ───
  const completedCount = products.filter(p => p.parts.length > 0 && p.brand).length;

  if (!backendOk) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="font-bold text-red-800 mb-2">Backend INAL no disponible</h3>
        <p className="text-sm text-red-600 mb-4">Ejecutá el servidor: <code className="bg-red-100 px-2 py-0.5 rounded">cd INAL-app && python app.py</code></p>
        <button onClick={() => init()} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Registro de Envase</h3>
            <p className="text-xs text-slate-500">
              Parseo → Materiales → Ficha Técnica → Solicitud TAD → Hammer
              {products.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                  {completedCount}/{products.length} listos
                </span>
              )}
              {tramiteId && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                  Trámite #{tramiteId}
                </span>
              )}
            </p>
          </div>
        </div>
        {onBack && <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700">← Volver</button>}
      </div>

      {/* Client selector */}
      {clients.length > 0 && !selectedClient && step === 'upload' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <label className="text-xs font-semibold text-slate-600 mb-2 block">Seleccionar cliente</label>
          <div className="flex gap-2 flex-wrap">
            {clients.map(c => (
              <button key={c.id} onClick={() => setSelectedClient(c)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-blue-100 text-sm rounded-lg border border-slate-200 hover:border-blue-300 transition-all">
                {c.razon_social} <span className="text-xs text-slate-400">({c.cuit})</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {selectedClient && (
        <div className="flex items-center gap-2 text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <span className="font-medium text-blue-800">{selectedClient.razon_social}</span>
          <span className="text-blue-500">CUIT: {selectedClient.cuit}</span>
          <button onClick={() => setSelectedClient(null)} className="ml-auto text-xs text-blue-600 hover:text-blue-800">Cambiar</button>
        </div>
      )}

      {/* Steps nav */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
        {([
          { id: 'upload', label: 'Cargar', icon: Upload },
          { id: 'products', label: `Productos${products.length ? ` (${products.length})` : ''}`, icon: Package },
          { id: 'ficha', label: 'Fichas', icon: FileText },
          { id: 'solicitud', label: 'Solicitud TAD', icon: FileText },
          { id: 'hammer', label: 'Hammer', icon: Hammer },
        ] as const).map(s => (
          <button key={s.id} onClick={() => setStep(s.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              step === s.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <s.icon className="w-3.5 h-3.5" />{s.label}
          </button>
        ))}
      </div>

      {/* ═══ Upload ═══ */}
      {step === 'upload' && (
        <div className="space-y-4">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.pdf,.docx" className="hidden"
            onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all flex flex-col items-center gap-3">
            {uploading ? <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" /> : <Upload className="w-8 h-8 text-slate-400" />}
            <div className="text-center">
              <p className="font-semibold text-slate-700">{uploading ? 'Procesando...' : 'Arrastrá o hacé clic para cargar'}</p>
              <p className="text-xs text-slate-400 mt-1">Factura, invoice o catálogo (.xlsx, .pdf, .docx)</p>
            </div>
          </button>
          {products.length > 0 && (
            <button onClick={() => setStep('products')} className="w-full py-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              Ya hay {products.length} productos → Ver productos
            </button>
          )}
        </div>
      )}

      {/* ═══ Products ═══ */}
      {step === 'products' && (
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="text-center py-8 text-slate-400"><Package className="w-10 h-10 mx-auto mb-2" /><p>Subí un documento primero.</p></div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-left">Nombre</th>
                    <th className="px-3 py-2 text-left">Material</th><th className="px-3 py-2 text-left">Marca</th>
                    <th className="px-3 py-2 text-left">Estado</th><th className="px-3 py-2 text-left">Acciones</th>
                  </tr></thead>
                  <tbody>{products.map((p, i) => {
                    const mat = materials.find(m => m.codigo === p.materialCode);
                    const isReady = p.parts.length > 0 && p.brand;
                    return (
                      <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-mono font-medium">{p.itemNo || '-'}</td>
                        <td className="px-3 py-2">{p.name || '-'}</td>
                        <td className="px-3 py-2">{mat
                          ? <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">{mat.nombre}</span>
                          : <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Sin asignar</span>}</td>
                        <td className="px-3 py-2 text-slate-500">{p.brand || '-'}</td>
                        <td className="px-3 py-2">{isReady
                          ? <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle className="w-3 h-3" /> Listo</span>
                          : <span className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="w-3 h-3" /> Incompleto</span>}</td>
                        <td className="px-3 py-2 flex gap-1">
                          <button onClick={() => startEdit(i)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded">Editar</button>
                          <button onClick={() => setPreviewProduct(p)} className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded"><Eye className="w-3 h-3" /></button>
                        </td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>

              {/* Editor */}
              {editingIdx !== null && (
                <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-4">
                  <h4 className="font-semibold text-slate-800">Editando: {products[editingIdx].itemNo || products[editingIdx].name}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { field: 'itemNo', label: 'Item / SKU' },
                      { field: 'name', label: 'Nombre' },
                      { field: 'brand', label: 'Marca' },
                      { field: 'colors', label: 'Colores' },
                      { field: 'models', label: 'Modelos/SKUs' },
                    ].map(f => (
                      <div key={f.field}>
                        <label className="text-xs font-medium text-slate-500">{f.label}</label>
                        <input value={(products[editingIdx] as any)[f.field]}
                          onChange={e => { const u = [...products]; (u[editingIdx!] as any)[f.field] = e.target.value; setProducts(u); }}
                          className="w-full mt-1 px-2 py-1.5 border border-slate-300 rounded-lg text-sm" />
                      </div>
                    ))}
                    <div className="col-span-2 md:col-span-3">
                      <label className="text-xs font-medium text-slate-500">Descripción</label>
                      <textarea value={products[editingIdx].description} rows={2}
                        onChange={e => { const u = [...products]; u[editingIdx!].description = e.target.value; setProducts(u); }}
                        className="w-full mt-1 px-2 py-1.5 border border-slate-300 rounded-lg text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Piezas / Composición</label>
                    {editingParts.map((part, i) => (
                      <div key={i} className="grid grid-cols-5 gap-2 mt-2 items-center">
                        <input value={part.name} onChange={e => { const u = [...editingParts]; u[i].name = e.target.value; setEditingParts(u); }}
                          placeholder="Pieza" className="px-2 py-1.5 border border-slate-300 rounded text-sm" />
                        <select value={part.materialCode} onChange={e => updatePart(i, e.target.value)}
                          className="px-2 py-1.5 border border-slate-300 rounded text-sm">
                          <option value="">Material...</option>
                          {materials.map(m => <option key={m.codigo} value={m.codigo}>{m.nombre}</option>)}
                        </select>
                        <input value={part.classification} readOnly className="px-2 py-1.5 border border-slate-200 rounded text-sm bg-slate-50 text-slate-400" />
                        <label className="flex items-center gap-1 text-xs">
                          <input type="checkbox" checked={part.foodContact} onChange={e => { const u = [...editingParts]; u[i].foodContact = e.target.checked; setEditingParts(u); }} />
                          Contacto
                        </label>
                        <button onClick={() => setEditingParts(editingParts.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button onClick={() => setEditingParts([...editingParts, { name: '', classification: '', material: '', materialCode: '', foodContact: false }])}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">+ Agregar pieza</button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Guardar</button>
                    <button onClick={() => { saveEdit(); setPreviewProduct(products[editingIdx!]); }}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Vista previa</button>
                    <button onClick={() => setEditingIdx(null)} className="px-4 py-2 text-slate-500 text-sm">Cancelar</button>
                  </div>
                </div>
              )}

              {/* Preview */}
              {previewProduct && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-slate-100 rounded-lg px-3 py-2">
                    <span className="text-xs font-semibold text-slate-600">VISTA PREVIA — {previewProduct.itemNo}</span>
                    <div className="flex gap-2">
                      <button onClick={() => doGenerateFicha(previewProduct)} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700">Generar PDF</button>
                      <button onClick={() => setPreviewProduct(null)} className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs">Cerrar</button>
                    </div>
                  </div>
                  {renderFichaPreview(previewProduct)}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={generateAllFichas} disabled={loading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Generar todas las fichas
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ Fichas ═══ */}
      {step === 'ficha' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h4 className="font-semibold text-slate-800 mb-3">Datos del fabricante</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[{ f: 'nombre', l: 'Razón social' }, { f: 'direccion', l: 'Dirección' }, { f: 'telefono', l: 'Teléfono' }, { f: 'email', l: 'Email' }, { f: 'pais', l: 'País' }].map(x => (
                <div key={x.f}>
                  <label className="text-xs font-medium text-slate-500">{x.l}</label>
                  <input value={(mfr as any)[x.f]} onChange={e => setMfr({ ...mfr, [x.f]: e.target.value })}
                    className="w-full mt-1 px-2 py-1.5 border border-slate-300 rounded-lg text-sm" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h4 className="font-semibold text-slate-800 mb-3">Fichas generadas</h4>
            {fichas.length === 0
              ? <p className="text-slate-400 text-sm text-center py-4">No hay fichas aún.</p>
              : fichas.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg mb-2">
                  <span className="font-mono font-medium text-sm">{f.item_number}</span>
                  <a href={f.pdf_path} target="_blank" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"><Download className="w-3 h-3" /> PDF</a>
                </div>
              ))}
          </div>
          <button onClick={generateAllFichas} disabled={loading || products.length === 0}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold text-sm hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Generar todas las fichas PDF
          </button>
        </div>
      )}

      {/* ═══ Solicitud ═══ */}
      {step === 'solicitud' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h4 className="font-semibold text-slate-800 mb-3">Datos del importador</h4>
            {selectedClient ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div><span className="text-slate-500">CUIT:</span> <strong>{selectedClient.cuit}</strong></div>
                <div><span className="text-slate-500">Razón social:</span> <strong>{selectedClient.razon_social}</strong></div>
                <div><span className="text-slate-500">Localidad:</span> {selectedClient.localidad}</div>
                <div><span className="text-slate-500">Dirección:</span> {selectedClient.calle}</div>
                <div><span className="text-slate-500">Tel:</span> {selectedClient.telefono}</div>
                <div><span className="text-slate-500">Email:</span> {selectedClient.email}</div>
              </div>
            ) : (
              <p className="text-amber-600 text-sm">Seleccioná un cliente primero (en el paso de Cargar)</p>
            )}
          </div>
          <button onClick={doGenerateSolicitud} disabled={products.length === 0}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" /> Generar Solicitud TAD
          </button>
        </div>
      )}

      {/* ═══ Hammer ═══ */}
      {step === 'hammer' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Hammer className="w-6 h-6 text-amber-400" />
              <div>
                <h4 className="font-bold">Hammer — Automatización</h4>
                <p className="text-xs text-slate-400">TAD, AFIP/ARCA y más</p>
              </div>
            </div>
            <div className="space-y-2">
              {hammerProcs.map(proc => (
                <div key={proc.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{proc.nombre}</p>
                    <p className="text-xs text-slate-400">{proc.pasos.length} pasos • {proc.dominio.toUpperCase()}</p>
                  </div>
                  <button onClick={() => launchHammer(proc.id)}
                    className="px-3 py-1.5 bg-amber-500 text-slate-900 rounded-lg text-xs font-bold hover:bg-amber-400 flex items-center gap-1">
                    <Play className="w-3 h-3" /> Ejecutar
                  </button>
                </div>
              ))}
            </div>
          </div>
          {ejecuciones.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="font-semibold text-slate-800 mb-3">Historial</h4>
              {ejecuciones.map(e => (
                <div key={e.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg mb-2">
                  {e.estado === 'completado' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> :
                   e.estado === 'fallido' ? <XCircle className="w-5 h-5 text-red-500" /> :
                   e.estado === 'ejecutando' ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> :
                   <Clock className="w-5 h-5 text-slate-400" />}
                  <div className="flex-1"><p className="text-sm font-medium">{e.procedimiento_nombre}</p>
                    <p className="text-xs text-slate-400">{e.pasos_ejecutados}/{e.pasos_totales} pasos</p></div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    e.estado === 'completado' ? 'bg-emerald-100 text-emerald-700' :
                    e.estado === 'fallido' ? 'bg-red-100 text-red-700' :
                    e.estado === 'ejecutando' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                    {e.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
