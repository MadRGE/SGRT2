import { useState, useEffect } from 'react';
import { Shield, Award, FileText, CheckCircle, AlertTriangle, Clock, Loader2, Upload, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  productUuid: string;
}

interface ProductData {
  id: string;
  uuid: string;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  marca: string | null;
  pais_origen: string | null;
  ncm: string | null;
  tipo_producto: string | null;
  cliente_id: string;
}

interface CertData {
  id: string;
  organismo: string;
  tipo: string;
  titulo: string;
  referencia: string | null;
  estado: string;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  resolucion: string | null;
}

interface DjcData {
  id: string;
  resolucion: string | null;
  estado: string;
  representante: string | null;
  created_at: string;
}

const ESTADO_ICON: Record<string, typeof CheckCircle> = {
  vigente: CheckCircle,
  en_renovacion: Clock,
};

export default function ProductPassport({ productUuid }: Props) {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [certs, setCerts] = useState<CertData[]>([]);
  const [djcs, setDjcs] = useState<DjcData[]>([]);
  const [clienteName, setClienteName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // DJC upload form
  const [showDjcForm, setShowDjcForm] = useState(false);
  const [djcForm, setDjcForm] = useState({ resolucion: '', representante: '', representante_cuit: '', notas: '' });
  const [djcSaving, setDjcSaving] = useState(false);
  const [djcSuccess, setDjcSuccess] = useState(false);

  useEffect(() => {
    loadPassport();
  }, [productUuid]);

  async function loadPassport() {
    setLoading(true);
    setError(null);
    try {
      const { data: prod, error: prodErr } = await supabase
        .from('productos_certificados')
        .select('*')
        .eq('uuid', productUuid)
        .eq('activo', true)
        .single();

      if (prodErr || !prod) {
        setError('Producto no encontrado o inactivo');
        setLoading(false);
        return;
      }
      setProduct(prod);

      const { data: certsData } = await supabase
        .from('certificados')
        .select('id, organismo, tipo, titulo, referencia, estado, fecha_emision, fecha_vencimiento, resolucion')
        .eq('producto_id', prod.id)
        .order('fecha_emision', { ascending: false });
      setCerts(certsData || []);

      const { data: djcData } = await supabase
        .from('djcs')
        .select('id, resolucion, estado, representante, created_at')
        .eq('producto_id', prod.id)
        .order('created_at', { ascending: false });
      setDjcs(djcData || []);

      const { data: cliente } = await supabase
        .from('clientes')
        .select('nombre')
        .eq('id', prod.cliente_id)
        .single();
      if (cliente) setClienteName(cliente.nombre);

      await supabase.from('qr_accesos').insert({
        producto_id: prod.id,
        accion: 'view',
        user_agent: navigator.userAgent,
      });
    } catch {
      setError('Error al cargar el producto');
    }
    setLoading(false);
  }

  async function submitDjc(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setDjcSaving(true);
    try {
      const { error } = await supabase.from('djcs').insert({
        producto_id: product.id,
        cliente_id: product.cliente_id,
        resolucion: djcForm.resolucion || null,
        representante: djcForm.representante || null,
        representante_cuit: djcForm.representante_cuit || null,
        notas: djcForm.notas || null,
        estado: 'borrador',
      });
      if (error) throw error;

      // Log the upload
      await supabase.from('qr_accesos').insert({
        producto_id: product.id,
        accion: 'djc_upload',
        user_agent: navigator.userAgent,
      });

      setDjcSuccess(true);
      setDjcForm({ resolucion: '', representante: '', representante_cuit: '', notas: '' });
      // Refresh DJCs
      const { data: djcData } = await supabase
        .from('djcs')
        .select('id, resolucion, estado, representante, created_at')
        .eq('producto_id', product.id)
        .order('created_at', { ascending: false });
      setDjcs(djcData || []);
    } catch (err: any) {
      alert(err.message || 'Error al enviar la DJC');
    }
    setDjcSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 mb-1">Producto no encontrado</h1>
          <p className="text-sm text-slate-500">{error || 'El enlace puede estar inactivo o ser incorrecto.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Product Passport</p>
              <p className="text-xs text-slate-400">Verificacion digital de producto</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">{product.nombre}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{product.codigo}</span>
            {product.marca && <span>{product.marca}</span>}
            {product.pais_origen && <span>Origen: {product.pais_origen}</span>}
          </div>
          {clienteName && <p className="text-sm text-slate-600 mt-2 font-medium">{clienteName}</p>}
          {product.descripcion && <p className="text-sm text-slate-500 mt-2">{product.descripcion}</p>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Certificates */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">Certificados vigentes</h2>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{certs.length}</span>
          </div>

          {certs.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">Sin certificados vigentes para este producto.</p>
          ) : (
            <div className="space-y-2">
              {certs.map(c => {
                const StatusIcon = ESTADO_ICON[c.estado] || CheckCircle;
                return (
                  <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <StatusIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${c.estado === 'vigente' ? 'text-green-500' : 'text-blue-500'}`} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-sm">{c.titulo}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">{c.organismo}</span>
                          <span className="text-xs text-slate-400">{c.tipo.replace('_', ' ')}</span>
                          {c.referencia && <span className="text-xs text-slate-400">Ref: {c.referencia}</span>}
                        </div>
                        <div className="flex gap-4 mt-2 text-xs text-slate-400">
                          {c.fecha_emision && <span>Emitido: {new Date(c.fecha_emision).toLocaleDateString('es-AR')}</span>}
                          {c.fecha_vencimiento && <span>Vence: {new Date(c.fecha_vencimiento).toLocaleDateString('es-AR')}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* DJCs */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Declaraciones Juradas</h2>
              {djcs.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{djcs.length}</span>
              )}
            </div>
            {!showDjcForm && !djcSuccess && (
              <button
                onClick={() => setShowDjcForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Subir mi DJC
              </button>
            )}
          </div>

          {/* DJC upload form */}
          {showDjcForm && !djcSuccess && (
            <div className="bg-blue-50/50 rounded-xl border border-blue-200 p-4 mb-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Cargar Declaracion Jurada de Composicion</h3>
              <p className="text-xs text-slate-500 mb-4">
                Complete los datos de su DJC. Sera recibida por el gestor para su revision.
              </p>
              <form onSubmit={submitDjc} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Resolucion</label>
                  <input
                    value={djcForm.resolucion}
                    onChange={e => setDjcForm({ ...djcForm, resolucion: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Ej: 237/2024"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Representante legal / tecnico *</label>
                  <input
                    value={djcForm.representante}
                    onChange={e => setDjcForm({ ...djcForm, representante: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">CUIT del representante</label>
                  <input
                    value={djcForm.representante_cuit}
                    onChange={e => setDjcForm({ ...djcForm, representante_cuit: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="XX-XXXXXXXX-X"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Notas</label>
                  <textarea
                    value={djcForm.notas}
                    onChange={e => setDjcForm({ ...djcForm, notas: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    rows={2}
                    placeholder="Informacion adicional..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDjcForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={djcSaving}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {djcSaving ? 'Enviando...' : 'Enviar DJC'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Success message */}
          {djcSuccess && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-4 mb-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">DJC enviada correctamente</p>
              <p className="text-xs text-green-600 mt-1">El gestor la revisara y actualizara el estado.</p>
              <button
                onClick={() => { setDjcSuccess(false); setShowDjcForm(false); }}
                className="mt-3 text-xs text-green-700 underline hover:text-green-800"
              >
                Cerrar
              </button>
            </div>
          )}

          {djcs.length === 0 && !showDjcForm && !djcSuccess ? (
            <p className="text-sm text-slate-400 py-4">Sin declaraciones juradas para este producto.</p>
          ) : (
            <div className="space-y-2">
              {djcs.map(d => (
                <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-slate-900">
                      DJC {d.resolucion ? `\u2014 Res. ${d.resolucion}` : ''}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      d.estado === 'firmada' ? 'bg-green-100 text-green-700' :
                      d.estado === 'borrador' ? 'bg-slate-100 text-slate-600' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {d.estado === 'borrador' ? 'pendiente revision' : d.estado}
                    </span>
                  </div>
                  {d.representante && <p className="text-xs text-slate-500 mt-1 ml-6">Representante: {d.representante}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Verificado el {new Date().toLocaleDateString('es-AR')} &mdash; SGRT Product Passport
          </p>
          <p className="text-[10px] text-slate-300 mt-1">
            Esta informacion es de caracter informativo. Los documentos originales prevalecen.
          </p>
        </div>
      </div>
    </div>
  );
}
