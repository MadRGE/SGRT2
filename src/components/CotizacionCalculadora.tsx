import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus, Trash2, Calculator, TrendingUp, AlertTriangle,
  DollarSign, Save, X, Search
} from 'lucide-react';

interface Props {
  cotizacionId?: string;
  onSave?: (cotizacionId: string) => void;
  onCancel?: () => void;
}

interface CotizacionItem {
  id?: number;
  tramite_tipo_id: string | null;
  servicio_catalogo_id?: string | null;
  concepto: string;
  tipo: string;
  costo_base: number;
  precio_venta: number;
  margen_unitario: number;
  margen_porcentaje: number;
  cantidad: number;
  subtotal_costo: number;
  subtotal_precio: number;
  requiere_tercero: boolean;
  proveedor_externo_id?: string | null;
  costo_proveedor_externo: number;
  notas_costo?: string;
}

interface TramiteTipo {
  id: string;
  codigo: string;
  nombre: string;
  costo_honorarios_base: number;
  costo_tasas_base: number;
}

interface ServicioCatalogo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  tipo_costo: string;
  costo_base_sugerido: number;
  precio_sugerido_estandar: number;
  precio_sugerido_corporativo: number;
  precio_sugerido_pyme: number;
  requiere_proveedor_externo: boolean;
  tiempo_estimado_horas: number;
}

interface ProveedorExterno {
  id: string;
  nombre: string;
  tipo: string;
  tipo_servicio: string[];
  calificacion: number;
}

interface ConfigMargen {
  categoria: string;
  margen_minimo: number;
  margen_objetivo: number;
}

interface Cliente {
  id: string;
  razon_social: string;
}

interface ContactoTemporal {
  id: string;
  nombre_empresa: string;
}

export default function CotizacionCalculadora({ cotizacionId, onSave, onCancel }: Props) {
  const [items, setItems] = useState<CotizacionItem[]>([]);
  const [tramiteTipos, setTramiteTipos] = useState<TramiteTipo[]>([]);
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioCatalogo[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorExterno[]>([]);
  const [configMargenes, setConfigMargenes] = useState<ConfigMargen[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contactosTemporales, setContactosTemporales] = useState<ContactoTemporal[]>([]);

  const [nombreCliente, setNombreCliente] = useState('');
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [contactoTemporalId, setContactoTemporalId] = useState<string | null>(null);
  const [tipoCliente, setTipoCliente] = useState<'existente' | 'nuevo' | 'contacto'>('existente');
  const [observaciones, setObservaciones] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);
  const [motivoDescuento, setMotivoDescuento] = useState('');

  const [mostrarSelectorTramite, setMostrarSelectorTramite] = useState(false);
  const [mostrarSelectorServicio, setMostrarSelectorServicio] = useState(false);
  const [searchTramite, setSearchTramite] = useState('');
  const [searchServicio, setSearchServicio] = useState('');
  const [tipoClientePrecios, setTipoClientePrecios] = useState<'estandar' | 'corporativo' | 'pyme'>('estandar');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [cotizacionId]);

  const loadData = async () => {
    setLoading(true);

    const [tramitesRes, serviciosRes, proveedoresRes, configRes, clientesRes, contactosRes] = await Promise.all([
      supabase.from('tramite_tipos').select('id, codigo, nombre, costo_honorarios_base, costo_tasas_base').order('nombre'),
      supabase.from('catalogo_servicios').select('*').eq('activo', true).order('nombre'),
      supabase.from('terceros').select('id, nombre, tipo, tipo_servicio, calificacion').eq('activo', true).order('nombre'),
      supabase.from('configuracion_margenes').select('*').eq('activo', true),
      supabase.from('clientes').select('id, razon_social').order('razon_social'),
      supabase.from('contactos_temporales').select('id, nombre_empresa').eq('estado', 'nuevo').order('nombre_empresa')
    ]);

    if (tramitesRes.data) setTramiteTipos(tramitesRes.data);
    if (serviciosRes.data) setServiciosCatalogo(serviciosRes.data);
    if (proveedoresRes.data) setProveedores(proveedoresRes.data);
    if (configRes.data) setConfigMargenes(configRes.data);
    if (clientesRes.data) setClientes(clientesRes.data);
    if (contactosRes.data) setContactosTemporales(contactosRes.data);

    if (cotizacionId) {
      const { data: cotizacion } = await supabase
        .from('cotizaciones')
        .select('*, cotizacion_items(*)')
        .eq('id', cotizacionId)
        .single();

      if (cotizacion) {
        setNombreCliente(cotizacion.nombre_cliente);
        setClienteId(cotizacion.cliente_id);
        setContactoTemporalId(cotizacion.contacto_temporal_id);

        if (cotizacion.cliente_id) {
          setTipoCliente('existente');
        } else if (cotizacion.contacto_temporal_id) {
          setTipoCliente('contacto');
        } else {
          setTipoCliente('nuevo');
        }

        setObservaciones(cotizacion.observaciones || '');
        setFechaVencimiento(cotizacion.fecha_vencimiento || '');
        setDescuentoPorcentaje(cotizacion.descuento_porcentaje || 0);
        setMotivoDescuento(cotizacion.motivo_descuento || '');

        if (cotizacion.cotizacion_items) {
          setItems(cotizacion.cotizacion_items);
        }
      }
    }

    setLoading(false);
  };

  const handleSeleccionarCliente = (tipo: 'existente' | 'nuevo' | 'contacto', id?: string, nombre?: string) => {
    setTipoCliente(tipo);

    if (tipo === 'existente' && id) {
      setClienteId(id);
      setContactoTemporalId(null);
      setNombreCliente(nombre || '');
    } else if (tipo === 'contacto' && id) {
      setContactoTemporalId(id);
      setClienteId(null);
      setNombreCliente(nombre || '');
    } else if (tipo === 'nuevo') {
      setClienteId(null);
      setContactoTemporalId(null);
      setNombreCliente('');
    }
  };

  const calcularTotales = () => {
    const costoTotal = items.reduce((sum, item) => {
      const costoItem = (item.costo_base + item.costo_proveedor_externo) * item.cantidad;
      return sum + costoItem;
    }, 0);
    const precioTotal = items.reduce((sum, item) => sum + item.subtotal_precio, 0);
    const descuentoMonto = precioTotal * (descuentoPorcentaje / 100);
    const precioFinal = precioTotal - descuentoMonto;
    const margenTotal = precioFinal - costoTotal;
    const margenPorcentaje = costoTotal > 0 ? (margenTotal / costoTotal) * 100 : 100;

    return { costoTotal, precioTotal, descuentoMonto, precioFinal, margenTotal, margenPorcentaje };
  };

  const agregarTramite = (tramite: TramiteTipo) => {
    const costoBase = (tramite.costo_honorarios_base || 0) + (tramite.costo_tasas_base || 0);
    const margenObjetivo = configMargenes.find(c => c.categoria === 'honorarios')?.margen_objetivo || 40;
    const precioVenta = costoBase * (1 + margenObjetivo / 100);
    const margenUnitario = precioVenta - costoBase;
    const margenPorcentaje = costoBase > 0 ? (margenUnitario / costoBase) * 100 : 0;

    const nuevoItem: CotizacionItem = {
      tramite_tipo_id: tramite.id,
      servicio_catalogo_id: null,
      concepto: tramite.nombre,
      tipo: 'honorarios',
      costo_base: costoBase,
      precio_venta: precioVenta,
      margen_unitario: margenUnitario,
      margen_porcentaje: margenPorcentaje,
      cantidad: 1,
      subtotal_costo: costoBase,
      subtotal_precio: precioVenta,
      requiere_tercero: false,
      proveedor_externo_id: null,
      costo_proveedor_externo: 0,
      notas_costo: ''
    };

    setItems([...items, nuevoItem]);
    setMostrarSelectorTramite(false);
    setSearchTramite('');
  };

  const agregarServicio = (servicio: ServicioCatalogo) => {
    let precioVenta = servicio.precio_sugerido_estandar;
    if (tipoClientePrecios === 'corporativo') precioVenta = servicio.precio_sugerido_corporativo;
    if (tipoClientePrecios === 'pyme') precioVenta = servicio.precio_sugerido_pyme;

    const costoBase = servicio.costo_base_sugerido || 0;
    const margenUnitario = precioVenta - costoBase;
    const margenPorcentaje = costoBase > 0 ? (margenUnitario / costoBase) * 100 : 100;

    const nuevoItem: CotizacionItem = {
      tramite_tipo_id: null,
      servicio_catalogo_id: servicio.id,
      concepto: servicio.nombre,
      tipo: servicio.categoria,
      costo_base: costoBase,
      precio_venta: precioVenta,
      margen_unitario: margenUnitario,
      margen_porcentaje: margenPorcentaje,
      cantidad: 1,
      subtotal_costo: costoBase,
      subtotal_precio: precioVenta,
      requiere_tercero: servicio.requiere_proveedor_externo,
      proveedor_externo_id: null,
      costo_proveedor_externo: 0,
      notas_costo: ''
    };

    setItems([...items, nuevoItem]);
    setMostrarSelectorServicio(false);
    setSearchServicio('');
  };

  const actualizarItem = (index: number, campo: keyof CotizacionItem, valor: any) => {
    const newItems = [...items];
    const item = newItems[index];

    if (campo === 'precio_venta') {
      item.precio_venta = Number(valor);
      const costoTotalItem = item.costo_base + item.costo_proveedor_externo;
      item.margen_unitario = item.precio_venta - costoTotalItem;
      item.margen_porcentaje = costoTotalItem > 0 ? (item.margen_unitario / costoTotalItem) * 100 : 100;
      item.subtotal_precio = item.precio_venta * item.cantidad;
    } else if (campo === 'cantidad') {
      item.cantidad = Number(valor);
      item.subtotal_costo = (item.costo_base + item.costo_proveedor_externo) * item.cantidad;
      item.subtotal_precio = item.precio_venta * item.cantidad;
    } else if (campo === 'costo_base') {
      item.costo_base = Number(valor);
      const costoTotalItem = item.costo_base + item.costo_proveedor_externo;
      item.margen_unitario = item.precio_venta - costoTotalItem;
      item.margen_porcentaje = costoTotalItem > 0 ? (item.margen_unitario / costoTotalItem) * 100 : 100;
      item.subtotal_costo = costoTotalItem * item.cantidad;
    } else if (campo === 'costo_proveedor_externo') {
      item.costo_proveedor_externo = Number(valor);
      const costoTotalItem = item.costo_base + item.costo_proveedor_externo;
      item.margen_unitario = item.precio_venta - costoTotalItem;
      item.margen_porcentaje = costoTotalItem > 0 ? (item.margen_unitario / costoTotalItem) * 100 : 100;
      item.subtotal_costo = costoTotalItem * item.cantidad;
    } else {
      (item as any)[campo] = valor;
    }

    setItems(newItems);
  };

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const getMargenColor = (margenPorcentaje: number, tipo: string, sinCostoBase: boolean = false) => {
    if (sinCostoBase) return 'text-blue-600';

    const config = configMargenes.find(c => c.categoria === tipo);
    if (!config) return 'text-slate-600';

    if (margenPorcentaje < config.margen_minimo) return 'text-red-600';
    if (margenPorcentaje >= config.margen_objetivo) return 'text-green-600';
    return 'text-yellow-600';
  };

  const handleGuardar = async () => {
    if (tipoCliente === 'existente' && !clienteId) {
      alert('Debe seleccionar un cliente existente');
      return;
    }

    if (tipoCliente === 'contacto' && !contactoTemporalId) {
      alert('Debe seleccionar un lead/contacto');
      return;
    }

    if (tipoCliente === 'nuevo' && !nombreCliente.trim()) {
      alert('Debe ingresar el nombre del cliente');
      return;
    }

    if (items.length === 0) {
      alert('Debe agregar al menos un ítem');
      return;
    }

    setSaving(true);

    const { costoTotal, precioTotal, descuentoMonto, precioFinal, margenTotal, margenPorcentaje } = calcularTotales();

    const cotizacionData = {
      nombre_cliente: nombreCliente,
      cliente_id: tipoCliente === 'existente' ? clienteId : null,
      contacto_temporal_id: tipoCliente === 'contacto' ? contactoTemporalId : null,
      costo_total: costoTotal,
      precio_total: precioTotal,
      descuento_porcentaje: descuentoPorcentaje,
      descuento_monto: descuentoMonto,
      motivo_descuento: motivoDescuento || null,
      precio_final: precioFinal,
      margen_total: margenTotal,
      margen_porcentaje: margenPorcentaje,
      observaciones: observaciones,
      fecha_vencimiento: fechaVencimiento || null,
      estado: 'borrador'
    };

    if (cotizacionId) {
      const { error: cotizError } = await supabase
        .from('cotizaciones')
        .update(cotizacionData)
        .eq('id', cotizacionId);

      if (cotizError) {
        alert('Error al actualizar cotización: ' + cotizError.message);
        setSaving(false);
        return;
      }

      await supabase.from('cotizacion_items').delete().eq('cotizacion_id', cotizacionId);

      const itemsData = items.map(item => ({
        cotizacion_id: cotizacionId,
        ...item
      }));

      const { error: itemsError } = await supabase.from('cotizacion_items').insert(itemsData);

      if (itemsError) {
        alert('Error al guardar ítems: ' + itemsError.message);
        setSaving(false);
        return;
      }

      if (onSave) onSave(cotizacionId);
    } else {
      const { data: nuevaCotizacion, error: cotizError } = await supabase
        .from('cotizaciones')
        .insert([cotizacionData])
        .select()
        .single();

      if (cotizError || !nuevaCotizacion) {
        alert('Error al crear cotización: ' + cotizError?.message);
        setSaving(false);
        return;
      }

      const itemsData = items.map(item => ({
        cotizacion_id: nuevaCotizacion.id,
        ...item
      }));

      const { error: itemsError } = await supabase.from('cotizacion_items').insert(itemsData);

      if (itemsError) {
        alert('Error al guardar ítems: ' + itemsError.message);
        setSaving(false);
        return;
      }

      if (onSave) onSave(nuevaCotizacion.id);
    }

    setSaving(false);
  };

  const tramitesFiltrados = tramiteTipos.filter(t =>
    t.nombre.toLowerCase().includes(searchTramite.toLowerCase()) ||
    t.codigo.toLowerCase().includes(searchTramite.toLowerCase())
  );

  const serviciosFiltrados = serviciosCatalogo.filter(s =>
    s.nombre.toLowerCase().includes(searchServicio.toLowerCase()) ||
    s.codigo.toLowerCase().includes(searchServicio.toLowerCase()) ||
    s.categoria.toLowerCase().includes(searchServicio.toLowerCase())
  );

  const totales = calcularTotales();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-blue-600" />
          Calculadora de Cotización
        </h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de Cliente *
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleSeleccionarCliente('existente')}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  tipoCliente === 'existente'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                Cliente Existente
              </button>
              <button
                type="button"
                onClick={() => handleSeleccionarCliente('contacto')}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  tipoCliente === 'contacto'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                Lead / Contacto
              </button>
              <button
                type="button"
                onClick={() => handleSeleccionarCliente('nuevo')}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  tipoCliente === 'nuevo'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                Nuevo Cliente
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              {tipoCliente === 'existente' && (
                <>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Seleccionar Cliente *
                  </label>
                  <select
                    value={clienteId || ''}
                    onChange={(e) => {
                      const cliente = clientes.find(c => c.id === e.target.value);
                      if (cliente) {
                        handleSeleccionarCliente('existente', cliente.id, cliente.razon_social);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Seleccione un cliente --</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.razon_social}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {tipoCliente === 'contacto' && (
                <>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Seleccionar Lead *
                  </label>
                  <select
                    value={contactoTemporalId || ''}
                    onChange={(e) => {
                      const contacto = contactosTemporales.find(c => c.id === e.target.value);
                      if (contacto) {
                        handleSeleccionarCliente('contacto', contacto.id, contacto.nombre_empresa);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Seleccione un lead --</option>
                    {contactosTemporales.map(contacto => (
                      <option key={contacto.id} value={contacto.id}>
                        {contacto.nombre_empresa}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {tipoCliente === 'nuevo' && (
                <>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre del Cliente / Empresa *
                  </label>
                  <input
                    type="text"
                    value={nombreCliente}
                    onChange={(e) => setNombreCliente(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Empresa ABC S.A."
                  />
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Válida hasta
              </label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-slate-800">Servicios / Trámites</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setMostrarSelectorServicio(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar Servicio
              </button>
              <button
                onClick={() => setMostrarSelectorTramite(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar Trámite
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No hay ítems agregados. Comienza agregando servicios o trámites.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-4">
                        <p className="font-medium text-slate-800 text-sm">{item.concepto}</p>
                        <p className="text-xs text-slate-600 capitalize">{item.tipo}</p>
                        {item.costo_base === 0 && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                            Servicio sin costo base
                          </span>
                        )}
                      </div>

                      <div className="col-span-2">
                        <label className="text-xs text-slate-600">Costo Base</label>
                        <input
                          type="number"
                          value={item.costo_base}
                          onChange={(e) => actualizarItem(index, 'costo_base', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-xs text-slate-600">Precio Venta</label>
                        <input
                          type="number"
                          value={item.precio_venta}
                          onChange={(e) => actualizarItem(index, 'precio_venta', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                        />
                      </div>

                      <div className="col-span-1">
                        <label className="text-xs text-slate-600">Cant.</label>
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-xs text-slate-600">Margen</label>
                        <p className={`font-semibold text-sm ${getMargenColor(item.margen_porcentaje, item.tipo, item.costo_base === 0)}`}>
                          {item.margen_porcentaje.toFixed(1)}%
                        </p>
                        <p className="text-xs text-slate-600">
                          ${item.margen_unitario.toLocaleString('es-AR')}
                        </p>
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          onClick={() => eliminarItem(index)}
                          className="p-2 hover:bg-red-100 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {item.requiere_tercero && (
                      <div className="grid grid-cols-12 gap-3 pt-3 border-t border-slate-300">
                        <div className="col-span-4">
                          <label className="text-xs text-slate-600 mb-1 block">Proveedor Externo</label>
                          <select
                            value={item.proveedor_externo_id || ''}
                            onChange={(e) => actualizarItem(index, 'proveedor_externo_id', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                          >
                            <option value="">-- Seleccionar proveedor --</option>
                            {proveedores.map(prov => (
                              <option key={prov.id} value={prov.id}>
                                {prov.nombre} ({prov.tipo})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="text-xs text-slate-600 mb-1 block">Costo Proveedor</label>
                          <input
                            type="number"
                            value={item.costo_proveedor_externo}
                            onChange={(e) => actualizarItem(index, 'costo_proveedor_externo', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                            placeholder="0"
                          />
                        </div>

                        <div className="col-span-6">
                          <label className="text-xs text-slate-600 mb-1 block">Notas sobre costo</label>
                          <input
                            type="text"
                            value={item.notas_costo || ''}
                            onChange={(e) => actualizarItem(index, 'notas_costo', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                            placeholder="Ej: Laboratorio, análisis, certificación..."
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`requiere-tercero-${index}`}
                        checked={item.requiere_tercero}
                        onChange={(e) => actualizarItem(index, 'requiere_tercero', e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor={`requiere-tercero-${index}`} className="text-xs text-slate-600 cursor-pointer">
                        Requiere proveedor externo / tercero
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Observaciones / Condiciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Condiciones especiales, notas, etc."
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descuento (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={descuentoPorcentaje}
                onChange={(e) => setDescuentoPorcentaje(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Motivo del descuento
              </label>
              <input
                type="text"
                value={motivoDescuento}
                onChange={(e) => setMotivoDescuento(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Cliente frecuente, volumen, promoción..."
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-6 rounded-lg border-2 border-blue-200">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Resumen Financiero
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-slate-600 mb-1">Costo Total</p>
              <p className="text-xl font-bold text-slate-800">
                ${totales.costoTotal.toLocaleString('es-AR')}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-600 mb-1">Precio Total</p>
              <p className="text-xl font-bold text-blue-600">
                ${totales.precioTotal.toLocaleString('es-AR')}
              </p>
            </div>

            {descuentoPorcentaje > 0 && (
              <div>
                <p className="text-sm text-slate-600 mb-1">Descuento ({descuentoPorcentaje}%)</p>
                <p className="text-xl font-bold text-orange-600">
                  -${totales.descuentoMonto.toLocaleString('es-AR')}
                </p>
              </div>
            )}

            <div className={descuentoPorcentaje > 0 ? '' : 'md:col-span-1'}>
              <p className="text-sm text-slate-600 mb-1">Precio Final</p>
              <p className="text-2xl font-bold text-green-600">
                ${totales.precioFinal.toLocaleString('es-AR')}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-600 mb-1">Margen Real</p>
              <p className={`text-xl font-bold ${getMargenColor(totales.margenPorcentaje, 'honorarios')}`}>
                {totales.margenPorcentaje.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-600">
                ${totales.margenTotal.toLocaleString('es-AR')}
              </p>
            </div>
          </div>

          {totales.margenPorcentaje < 20 && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>Margen bajo:</strong> El margen está por debajo del mínimo recomendado.
              </p>
            </div>
          )}

          {items.filter(i => i.tramite_tipo_id).length > 0 && (
            <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>📋 Expedientes a crear:</strong> Al convertir a proyecto se crearán{' '}
                <strong>{items.filter(i => i.tramite_tipo_id).length}</strong> expediente(s) de trámites.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar Cotización'}
          </button>

          {onCancel && (
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {mostrarSelectorServicio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Seleccionar Servicio del Catálogo</h3>
              <button
                onClick={() => {
                  setMostrarSelectorServicio(false);
                  setSearchServicio('');
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 border-b border-slate-200 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchServicio}
                  onChange={(e) => setSearchServicio(e.target.value)}
                  placeholder="Buscar por nombre, código o categoría..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <span className="text-sm text-slate-600">Precios para:</span>
                <button
                  onClick={() => setTipoClientePrecios('estandar')}
                  className={`px-3 py-1 rounded text-sm ${tipoClientePrecios === 'estandar' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                >
                  Estándar
                </button>
                <button
                  onClick={() => setTipoClientePrecios('corporativo')}
                  className={`px-3 py-1 rounded text-sm ${tipoClientePrecios === 'corporativo' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                >
                  Corporativo
                </button>
                <button
                  onClick={() => setTipoClientePrecios('pyme')}
                  className={`px-3 py-1 rounded text-sm ${tipoClientePrecios === 'pyme' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                >
                  PYME
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {serviciosFiltrados.map((servicio) => {
                  let precioMostrar = servicio.precio_sugerido_estandar;
                  if (tipoClientePrecios === 'corporativo') precioMostrar = servicio.precio_sugerido_corporativo;
                  if (tipoClientePrecios === 'pyme') precioMostrar = servicio.precio_sugerido_pyme;

                  return (
                    <button
                      key={servicio.id}
                      onClick={() => agregarServicio(servicio)}
                      className="w-full text-left p-4 border border-slate-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-slate-800">{servicio.nombre}</p>
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded capitalize">
                              {servicio.categoria}
                            </span>
                            {servicio.tipo_costo === 'sin_costo_base' && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                Sin costo base
                              </span>
                            )}
                            {servicio.requiere_proveedor_externo && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                                Requiere tercero
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{servicio.codigo}</p>
                          {servicio.descripcion && (
                            <p className="text-xs text-slate-500 mt-1">{servicio.descripcion}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm text-slate-600">Precio sugerido</p>
                          <p className="text-xl font-bold text-green-600">
                            ${precioMostrar.toLocaleString('es-AR')}
                          </p>
                          {servicio.costo_base_sugerido > 0 && (
                            <p className="text-xs text-slate-500">
                              Costo: ${servicio.costo_base_sugerido.toLocaleString('es-AR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {serviciosFiltrados.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No se encontraron servicios
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarSelectorTramite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Seleccionar Trámite</h3>
              <button
                onClick={() => {
                  setMostrarSelectorTramite(false);
                  setSearchTramite('');
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTramite}
                  onChange={(e) => setSearchTramite(e.target.value)}
                  placeholder="Buscar por nombre o código..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {tramitesFiltrados.map((tramite) => {
                  const costoTotal = (tramite.costo_honorarios_base || 0) + (tramite.costo_tasas_base || 0);
                  return (
                    <button
                      key={tramite.id}
                      onClick={() => agregarTramite(tramite)}
                      className="w-full text-left p-4 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-slate-800">{tramite.nombre}</p>
                          <p className="text-sm text-slate-600">{tramite.codigo}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-600">Costo base</p>
                          <p className="font-semibold text-slate-800">
                            ${costoTotal.toLocaleString('es-AR')}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {tramitesFiltrados.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No se encontraron trámites
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
