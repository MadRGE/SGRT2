import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Package,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  FileText,
  Eye,
  Edit,
  Download
} from 'lucide-react';
import { EspecificacionService, ProductoEspecificacion } from '../../services/EspecificacionService';
import { FichaTecnicaGenerator } from '../Productos/FichaTecnicaGenerator';
import { ProductSpecForm } from '../Productos/ProductSpecForm';

interface ExpedienteMultiProductoProps {
  expedienteId: string;
}

interface ProductoExpediente {
  id: string;
  expediente_id: string;
  producto_id: string;
  estado_individual: 'en_evaluacion' | 'aprobado' | 'observado' | 'rechazado';
  observaciones_individuales?: string;
  certificado_url?: string;
  fecha_aprobacion_individual?: string;
  numero_certificado?: string;
  producto: {
    id: string;
    nombre: string;
    marca?: string;
    rubro?: string;
    pais_origen?: string;
    cliente_id: string;
  };
}

interface Cliente {
  id: string;
  razon_social: string;
  cuit: string;
  direccion?: string;
}

export function ExpedienteMultiProducto({ expedienteId }: ExpedienteMultiProductoProps) {
  const [productos, setProductos] = useState<ProductoExpediente[]>([]);
  const [especificaciones, setEspecificaciones] = useState<Record<string, ProductoEspecificacion>>({});
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProducto, setSelectedProducto] = useState<ProductoExpediente | null>(null);
  const [showFichaTecnica, setShowFichaTecnica] = useState(false);
  const [showSpecForm, setShowSpecForm] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [expedienteId]);

  const loadData = async () => {
    setLoading(true);

    const { data: productosData, error: prodError } = await supabase
      .from('expediente_productos')
      .select(`
        *,
        producto:productos(*)
      `)
      .eq('expediente_id', expedienteId);

    if (prodError) {
      console.error('Error loading products:', prodError);
      setLoading(false);
      return;
    }

    const typedProductos = productosData as unknown as ProductoExpediente[];
    setProductos(typedProductos);

    if (typedProductos.length > 0) {
      const productoIds = typedProductos.map(p => p.producto_id);
      const specs = await EspecificacionService.getEspecificacionesByProductos(productoIds);
      setEspecificaciones(specs);

      const clienteId = typedProductos[0].producto.cliente_id;
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .single();

      setCliente(clienteData);
    }

    setLoading(false);
  };

  const handleUpdateStatus = async (
    productoExpedienteId: string,
    nuevoEstado: 'aprobado' | 'observado' | 'rechazado'
  ) => {
    const observaciones = prompt(
      nuevoEstado === 'observado' || nuevoEstado === 'rechazado'
        ? 'Ingrese las observaciones (obligatorio):'
        : 'Ingrese observaciones (opcional):'
    );

    if ((nuevoEstado === 'observado' || nuevoEstado === 'rechazado') && !observaciones) {
      alert('Las observaciones son obligatorias para este estado');
      return;
    }

    setUpdatingStatus(productoExpedienteId);

    const updateData: any = {
      estado_individual: nuevoEstado,
      observaciones_individuales: observaciones || null
    };

    if (nuevoEstado === 'aprobado') {
      updateData.fecha_aprobacion_individual = new Date().toISOString();

      const numeroCert = prompt('Ingrese el número de certificado (opcional):');
      if (numeroCert) {
        updateData.numero_certificado = numeroCert;
      }
    }

    const { error } = await supabase
      .from('expediente_productos')
      .update(updateData)
      .eq('id', productoExpedienteId);

    if (error) {
      alert(`Error al actualizar estado: ${error.message}`);
    } else {
      await loadData();
    }

    setUpdatingStatus(null);
  };

  const getStatusBadge = (estado: string) => {
    const configs = {
      en_evaluacion: {
        icon: <Clock className="w-4 h-4" />,
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'En Evaluación'
      },
      aprobado: {
        icon: <CheckCircle className="w-4 h-4" />,
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Aprobado'
      },
      observado: {
        icon: <AlertCircle className="w-4 h-4" />,
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        label: 'Observado'
      },
      rechazado: {
        icon: <XCircle className="w-4 h-4" />,
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Rechazado'
      }
    };

    const config = configs[estado as keyof typeof configs] || configs.en_evaluacion;

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bg} ${config.text} font-medium text-sm`}>
        {config.icon}
        {config.label}
      </div>
    );
  };

  const handleViewFichaTecnica = (producto: ProductoExpediente) => {
    setSelectedProducto(producto);
    setShowFichaTecnica(true);
  };

  const handleEditSpec = (producto: ProductoExpediente) => {
    setSelectedProducto(producto);
    setShowSpecForm(true);
  };

  const selectedEspec = selectedProducto ? especificaciones[selectedProducto.producto_id] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
        <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <p className="text-slate-600">No hay productos asignados a este expediente</p>
      </div>
    );
  }

  const totalProductos = productos.length;
  const aprobados = productos.filter(p => p.estado_individual === 'aprobado').length;
  const enEvaluacion = productos.filter(p => p.estado_individual === 'en_evaluacion').length;
  const observados = productos.filter(p => p.estado_individual === 'observado').length;
  const rechazados = productos.filter(p => p.estado_individual === 'rechazado').length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Progreso de Productos</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{totalProductos}</div>
            <div className="text-sm text-slate-600">Total</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{aprobados}</div>
            <div className="text-sm text-slate-600">Aprobados</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{enEvaluacion}</div>
            <div className="text-sm text-slate-600">En Evaluación</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{observados}</div>
            <div className="text-sm text-slate-600">Observados</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{rechazados}</div>
            <div className="text-sm text-slate-600">Rechazados</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(aprobados / totalProductos) * 100}%` }}
            />
          </div>
          <p className="text-sm text-slate-600 mt-2 text-center">
            {aprobados} de {totalProductos} productos aprobados ({Math.round((aprobados / totalProductos) * 100)}%)
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Producto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Marca/Modelo</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Especificaciones</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Estado</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Certificado</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {productos.map((prod) => {
                const hasSpec = !!especificaciones[prod.producto_id];
                const isUpdating = updatingStatus === prod.id;

                return (
                  <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-900">{prod.producto.nombre}</div>
                          <div className="text-sm text-slate-500">{prod.producto.rubro}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {prod.producto.marca || '—'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {hasSpec ? (
                        <div className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Completas
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-red-700 bg-red-50 px-3 py-1 rounded-full text-sm">
                          <XCircle className="w-4 h-4" />
                          Incompletas
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(prod.estado_individual)}
                    </td>
                    <td className="px-4 py-4 text-center text-sm">
                      {prod.numero_certificado ? (
                        <div className="text-blue-600 font-mono">{prod.numero_certificado}</div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditSpec(prod)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar especificaciones"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {hasSpec && (
                          <button
                            onClick={() => handleViewFichaTecnica(prod)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Ver ficha técnica"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        {prod.observaciones_individuales && (
                          <button
                            onClick={() => alert(prod.observaciones_individuales)}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            title="Ver observaciones"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {prod.estado_individual !== 'aprobado' && (
                          <div className="flex gap-1 ml-2 border-l pl-2">
                            <button
                              onClick={() => handleUpdateStatus(prod.id, 'aprobado')}
                              disabled={isUpdating}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(prod.id, 'observado')}
                              disabled={isUpdating}
                              className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:opacity-50"
                            >
                              Observar
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(prod.id, 'rechazado')}
                              disabled={isUpdating}
                              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProducto && showSpecForm && (
        <ProductSpecForm
          isOpen={showSpecForm}
          onClose={() => {
            setShowSpecForm(false);
            setSelectedProducto(null);
          }}
          onSuccess={() => {
            setShowSpecForm(false);
            setSelectedProducto(null);
            loadData();
          }}
          productoId={selectedProducto.producto_id}
          productoNombre={selectedProducto.producto.nombre}
          tipoEspecificacion="envases_anmat"
        />
      )}

      {selectedProducto && showFichaTecnica && selectedEspec && cliente && (
        <FichaTecnicaGenerator
          isOpen={showFichaTecnica}
          onClose={() => {
            setShowFichaTecnica(false);
            setSelectedProducto(null);
          }}
          productoNombre={selectedProducto.producto.nombre}
          productoMarca={selectedProducto.producto.marca}
          clienteData={{
            razon_social: cliente.razon_social,
            cuit: cliente.cuit,
            direccion: cliente.direccion
          }}
          especificacion={{
            fabricante: selectedEspec.fabricante || '',
            pais_fabricacion: selectedEspec.pais_fabricacion || '',
            datos_tecnicos: selectedEspec.datos_tecnicos
          }}
        />
      )}
    </div>
  );
}
