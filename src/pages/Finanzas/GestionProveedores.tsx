import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import {
  Users,
  Plus,
  Building,
  FlaskConical,
  Shield,
  Truck,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  X
} from 'lucide-react';

interface Tercero {
  id: string;
  nombre: string;
  cuit: string;
  email: string | null;
  telefono: string | null;
  tipo: 'laboratorio' | 'ocp' | 'broker_aduanal' | 'rt' | 'otro';
  direccion: string | null;
  created_at: string;
}

interface FacturaProveedor {
  id: string;
  gestion_id: string;
  proveedor_id: string;
  numero_factura: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  monto_total: number;
  estado_pago: string;
  fecha_pago: string | null;
  notas: string | null;
  gestiones: {
    nombre: string;
  } | null;
  terceros: {
    nombre: string;
  };
}

export default function GestionProveedores() {
  const [activeTab, setActiveTab] = useState<'facturas' | 'catalogo'>('facturas');
  const [proveedores, setProveedores] = useState<Tercero[]>([]);
  const [facturas, setFacturas] = useState<FacturaProveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProveedorModal, setShowProveedorModal] = useState(false);
  const [showFacturaModal, setShowFacturaModal] = useState(false);

  const [proveedorForm, setProveedorForm] = useState({
    nombre: '',
    cuit: '',
    email: '',
    telefono: '',
    tipo: 'laboratorio' as Tercero['tipo'],
    direccion: ''
  });

  const [facturaForm, setFacturaForm] = useState({
    gestion_id: '',
    proveedor_id: '',
    numero_factura: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    monto_total: '',
    notas: ''
  });

  const [gestiones, setGestiones] = useState<Array<{ id: string; nombre: string }>>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const [{ data: proveedoresData }, { data: facturasData }, { data: gestionesData }] =
      await Promise.all([
        supabase.from('terceros').select('*').order('nombre'),
        supabase
          .from('facturas_proveedores')
          .select(`*, gestiones(nombre), terceros(nombre)`)
          .order('fecha_emision', { ascending: false }),
        supabase.from('gestiones').select('id, nombre').order('nombre')
      ]);

    if (proveedoresData) setProveedores(proveedoresData);
    if (facturasData) setFacturas(facturasData as any);
    if (gestionesData) setGestiones(gestionesData);

    setLoading(false);
  };

  const handleCreateProveedor = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('terceros').insert([
      {
        nombre: proveedorForm.nombre,
        cuit: proveedorForm.cuit,
        email: proveedorForm.email || null,
        telefono: proveedorForm.telefono || null,
        tipo: proveedorForm.tipo,
        direccion: proveedorForm.direccion || null
      }
    ]);

    if (error) {
      toast.error(`Error al crear proveedor: ${error.message}`);
      return;
    }

    setShowProveedorModal(false);
    setProveedorForm({
      nombre: '',
      cuit: '',
      email: '',
      telefono: '',
      tipo: 'laboratorio',
      direccion: ''
    });
    loadData();
  };

  const handleCreateFactura = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('facturas_proveedores').insert([
      {
        gestion_id: facturaForm.gestion_id,
        proveedor_id: facturaForm.proveedor_id,
        numero_factura: facturaForm.numero_factura,
        fecha_emision: facturaForm.fecha_emision,
        fecha_vencimiento: facturaForm.fecha_vencimiento || null,
        monto_total: parseFloat(facturaForm.monto_total),
        estado_pago: 'pendiente',
        notas: facturaForm.notas || null
      }
    ]);

    if (error) {
      toast.error(`Error al cargar factura: ${error.message}`);
      return;
    }

    setShowFacturaModal(false);
    setFacturaForm({
      gestion_id: '',
      proveedor_id: '',
      numero_factura: '',
      fecha_emision: new Date().toISOString().split('T')[0],
      fecha_vencimiento: '',
      monto_total: '',
      notas: ''
    });
    loadData();
  };

  const handleMarcarPagada = async (facturaId: string) => {
    const { error } = await supabase
      .from('facturas_proveedores')
      .update({
        estado_pago: 'pagada',
        fecha_pago: new Date().toISOString()
      })
      .eq('id', facturaId);

    if (error) {
      toast.error(`Error al marcar como pagada: ${error.message}`);
      return;
    }

    loadData();
  };

  const getEstadoInfo = (factura: FacturaProveedor) => {
    if (factura.estado_pago === 'pagada') {
      return {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        label: 'Pagada'
      };
    }

    if (factura.fecha_vencimiento) {
      const hoy = new Date();
      const vencimiento = new Date(factura.fecha_vencimiento);

      if (vencimiento < hoy) {
        return {
          color: 'bg-red-100 text-red-800',
          icon: AlertCircle,
          label: 'Vencida'
        };
      }
    }

    return {
      color: 'bg-amber-100 text-amber-800',
      icon: Clock,
      label: 'Pendiente'
    };
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'laboratorio':
        return <FlaskConical className="w-4 h-4 text-blue-600" />;
      case 'ocp':
        return <Shield className="w-4 h-4 text-green-600" />;
      case 'broker_aduanal':
        return <Truck className="w-4 h-4 text-amber-600" />;
      case 'rt':
        return <FileText className="w-4 h-4 text-purple-600" />;
      default:
        return <Building className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      laboratorio: 'Laboratorio',
      ocp: 'OCP',
      broker_aduanal: 'Broker Aduanal',
      rt: 'Responsable Técnico',
      otro: 'Otro'
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('facturas')}
            className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'facturas'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Cuentas por Pagar
          </button>
          <button
            onClick={() => setActiveTab('catalogo')}
            className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'catalogo'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Catálogo de Proveedores
          </button>
        </div>
      </div>

      {/* Tab: Cuentas por Pagar */}
      {activeTab === 'facturas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Facturas de Proveedores (Cuentas por Pagar)
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Gestión de facturas recibidas y control de pagos
              </p>
            </div>
            <button
              onClick={() => setShowFacturaModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Cargar Factura
            </button>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            {facturas.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h4 className="text-lg font-semibold text-slate-800 mb-2">
                  No hay facturas de proveedores registradas
                </h4>
                <p className="text-slate-600 mb-4">
                  Comienza cargando las facturas recibidas de tus proveedores
                </p>
                <button
                  onClick={() => setShowFacturaModal(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Cargar Primera Factura
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium text-slate-700">
                        Factura / Proveedor
                      </th>
                      <th className="p-3 text-left text-sm font-medium text-slate-700">
                        Gestión
                      </th>
                      <th className="p-3 text-left text-sm font-medium text-slate-700">
                        Vencimiento
                      </th>
                      <th className="p-3 text-right text-sm font-medium text-slate-700">Monto</th>
                      <th className="p-3 text-left text-sm font-medium text-slate-700">Estado</th>
                      <th className="p-3 text-center text-sm font-medium text-slate-700">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturas.map((f) => {
                      const estadoInfo = getEstadoInfo(f);
                      const IconComponent = estadoInfo.icon;

                      return (
                        <tr
                          key={f.id}
                          className="border-t border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <td className="p-3">
                            <p className="font-medium text-slate-800">{f.numero_factura}</p>
                            <p className="text-xs text-slate-500">{f.terceros.nombre}</p>
                          </td>
                          <td className="p-3 text-sm text-blue-700 font-medium">
                            {f.gestiones?.nombre || 'Sin gestión'}
                          </td>
                          <td className="p-3 text-sm text-slate-600">
                            {f.fecha_vencimiento
                              ? new Date(f.fecha_vencimiento).toLocaleDateString('es-AR')
                              : '-'}
                          </td>
                          <td className="p-3 text-right font-semibold text-slate-800">
                            ${f.monto_total.toLocaleString('es-AR')}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${estadoInfo.color}`}
                            >
                              <IconComponent className="w-3 h-3" />
                              {estadoInfo.label}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {f.estado_pago !== 'pagada' && (
                              <button
                                onClick={() => handleMarcarPagada(f.id)}
                                className="inline-flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Marcar Pagada
                              </button>
                            )}
                            {f.estado_pago === 'pagada' && (
                              <span className="text-sm text-green-600 flex items-center justify-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Pagado {f.fecha_pago && `(${new Date(f.fecha_pago).toLocaleDateString('es-AR')})`}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Catálogo de Proveedores */}
      {activeTab === 'catalogo' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Catálogo de Proveedores y Terceros
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Gestión de laboratorios, OCPs, despachantes y otros proveedores
              </p>
            </div>
            <button
              onClick={() => setShowProveedorModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Proveedor
            </button>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            {proveedores.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h4 className="text-lg font-semibold text-slate-800 mb-2">
                  No hay proveedores registrados
                </h4>
                <p className="text-slate-600 mb-4">
                  Comienza agregando laboratorios, OCPs u otros proveedores
                </p>
                <button
                  onClick={() => setShowProveedorModal(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Primer Proveedor
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium text-slate-700">Nombre</th>
                      <th className="p-3 text-left text-sm font-medium text-slate-700">Tipo</th>
                      <th className="p-3 text-left text-sm font-medium text-slate-700">CUIT</th>
                      <th className="p-3 text-left text-sm font-medium text-slate-700">Email</th>
                      <th className="p-3 text-left text-sm font-medium text-slate-700">
                        Teléfono
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedores.map((p) => (
                      <tr
                        key={p.id}
                        className="border-t border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-3 font-medium text-slate-800">{p.nombre}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-2 text-sm">
                            {getTipoIcon(p.tipo)}
                            <span className="font-medium">{getTipoLabel(p.tipo)}</span>
                          </span>
                        </td>
                        <td className="p-3 text-sm text-slate-600 font-mono">{p.cuit}</td>
                        <td className="p-3 text-sm text-blue-600">{p.email || '-'}</td>
                        <td className="p-3 text-sm text-slate-600">{p.telefono || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Nuevo Proveedor */}
      {showProveedorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Nuevo Proveedor / Tercero</h3>
              <button
                onClick={() => setShowProveedorModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProveedor} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre / Razón Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={proveedorForm.nombre}
                    onChange={(e) =>
                      setProveedorForm({ ...proveedorForm, nombre: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md"
                    placeholder="Ej: Laboratorio LACI S.A."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">CUIT *</label>
                  <input
                    type="text"
                    required
                    value={proveedorForm.cuit}
                    onChange={(e) => setProveedorForm({ ...proveedorForm, cuit: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md"
                    placeholder="30-12345678-9"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tipo *</label>
                  <select
                    required
                    value={proveedorForm.tipo}
                    onChange={(e) =>
                      setProveedorForm({
                        ...proveedorForm,
                        tipo: e.target.value as Tercero['tipo']
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="laboratorio">Laboratorio</option>
                    <option value="ocp">OCP (Organismo de Certificación)</option>
                    <option value="broker_aduanal">Broker Aduanal / Despachante</option>
                    <option value="rt">Responsable Técnico</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={proveedorForm.email}
                    onChange={(e) => setProveedorForm({ ...proveedorForm, email: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md"
                    placeholder="contacto@proveedor.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={proveedorForm.telefono}
                    onChange={(e) =>
                      setProveedorForm({ ...proveedorForm, telefono: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md"
                    placeholder="+54 11 1234-5678"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Dirección</label>
                  <input
                    type="text"
                    value={proveedorForm.direccion}
                    onChange={(e) =>
                      setProveedorForm({ ...proveedorForm, direccion: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md"
                    placeholder="Calle 123, Ciudad, Provincia"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProveedorModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Crear Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nueva Factura */}
      {showFacturaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Cargar Factura de Proveedor</h3>
              <button
                onClick={() => setShowFacturaModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFactura} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Gestión *
                  </label>
                  <select
                    required
                    value={facturaForm.gestion_id}
                    onChange={(e) =>
                      setFacturaForm({ ...facturaForm, gestion_id: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="">Seleccionar gestión...</option>
                    {gestiones.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Proveedor *
                  </label>
                  <select
                    required
                    value={facturaForm.proveedor_id}
                    onChange={(e) =>
                      setFacturaForm({ ...facturaForm, proveedor_id: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="">Seleccionar proveedor...</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({getTipoLabel(p.tipo)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Número de Factura *
                  </label>
                  <input
                    type="text"
                    required
                    value={facturaForm.numero_factura}
                    onChange={(e) =>
                      setFacturaForm({ ...facturaForm, numero_factura: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md"
                    placeholder="FC-A-0001-12345"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha de Emisión *
                  </label>
                  <input
                    type="date"
                    required
                    value={facturaForm.fecha_emision}
                    onChange={(e) =>
                      setFacturaForm({ ...facturaForm, fecha_emision: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={facturaForm.fecha_vencimiento}
                    onChange={(e) =>
                      setFacturaForm({ ...facturaForm, fecha_vencimiento: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Monto Total *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={facturaForm.monto_total}
                    onChange={(e) =>
                      setFacturaForm({ ...facturaForm, monto_total: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md"
                    placeholder="25000.00"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notas</label>
                  <textarea
                    value={facturaForm.notas}
                    onChange={(e) => setFacturaForm({ ...facturaForm, notas: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md"
                    rows={3}
                    placeholder="Notas adicionales sobre esta factura..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFacturaModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Cargar Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
