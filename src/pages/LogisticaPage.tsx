/**
 * LogisticaPage — Vehicles & delivery routes (premium module).
 */
import { useState, useEffect } from 'react';
import {
  MapPin, Plus, Loader2, X, Truck, Car, Route,
  CheckCircle, Clock, Navigation, Wrench,
} from 'lucide-react';

const API = 'http://localhost:8500/api/v2';
const token = () => localStorage.getItem('sgrt_token') || '';
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

interface Vehiculo {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  tipo: string;
  estado: string;
  km_actual: number;
  proximo_service_km: number;
}

interface Ruta {
  id: string;
  vehiculo_id: string;
  conductor: string;
  fecha: string;
  estado: string;
  paradas: number;
  km_total: number;
  notas: string;
  created_at: string;
  paradas_list?: Parada[];
}

interface Parada {
  id: string;
  orden: number;
  direccion: string;
  referencia: string;
  estado: string;
  hora_llegada: string | null;
}

type Tab = 'vehiculos' | 'rutas';

interface Props {
  clienteId?: string;
}

export default function LogisticaPage({ clienteId }: Props) {
  const [tab, setTab] = useState<Tab>('rutas');
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVehiculoForm, setShowVehiculoForm] = useState(false);

  // Vehicle form
  const [vForm, setVForm] = useState({ patente: '', marca: '', modelo: '', anio: 2024, tipo: 'utilitario', km_actual: 0, proximo_service_km: 0 });
  const [saving, setSaving] = useState(false);

  const cid = clienteId || '';

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [vehR, rutR] = await Promise.all([
        fetch(`${API}/logistica/vehiculos?cliente_id=${cid}`, { headers: headers() }),
        fetch(`${API}/logistica/rutas?cliente_id=${cid}`, { headers: headers() }),
      ]);
      if (vehR.ok) setVehiculos(await vehR.json());
      if (rutR.ok) setRutas(await rutR.json());
    } catch {}
    setLoading(false);
  }

  async function createVehiculo() {
    if (!vForm.patente || !cid) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/logistica/vehiculos`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ ...vForm, cliente_id: cid }),
      });
      if (res.ok) {
        setShowVehiculoForm(false);
        setVForm({ patente: '', marca: '', modelo: '', anio: 2024, tipo: 'utilitario', km_actual: 0, proximo_service_km: 0 });
        load();
      }
    } catch {}
    setSaving(false);
  }

  async function updateRutaEstado(id: string, estado: string) {
    await fetch(`${API}/logistica/rutas/${id}/estado?estado=${estado}`, { method: 'PUT', headers: headers() });
    load();
  }

  async function completarParada(id: string) {
    await fetch(`${API}/logistica/paradas/${id}/completar`, { method: 'PUT', headers: headers() });
    load();
  }

  const estadoVehiculo = (e: string) => {
    switch (e) {
      case 'disponible': return 'bg-emerald-500/20 text-emerald-400';
      case 'en_ruta': return 'bg-blue-500/20 text-blue-400';
      case 'mantenimiento': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const estadoRuta = (e: string) => {
    switch (e) {
      case 'planificada': return 'bg-slate-500/20 text-slate-400';
      case 'en_curso': return 'bg-blue-500/20 text-blue-400';
      case 'completada': return 'bg-emerald-500/20 text-emerald-400';
      default: return 'bg-red-500/20 text-red-400';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Route className="w-7 h-7 text-teal-400" /> Logística
          </h1>
          <p className="text-slate-400 text-sm mt-1">Vehículos, rutas y entregas</p>
        </div>
        {tab === 'vehiculos' && (
          <button onClick={() => setShowVehiculoForm(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nuevo Vehículo
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit">
        {(['rutas', 'vehiculos'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}>
            {t === 'rutas' ? `Rutas (${rutas.length})` : `Vehículos (${vehiculos.length})`}
          </button>
        ))}
      </div>

      {/* Vehicle form */}
      {showVehiculoForm && (
        <div className="bg-slate-800 border border-teal-500/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Nuevo Vehículo</h3>
            <button onClick={() => setShowVehiculoForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-400">Patente *</label>
              <input value={vForm.patente} onChange={e => setVForm({ ...vForm, patente: e.target.value.toUpperCase() })}
                placeholder="ABC 123"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Marca</label>
              <input value={vForm.marca} onChange={e => setVForm({ ...vForm, marca: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Modelo</label>
              <input value={vForm.modelo} onChange={e => setVForm({ ...vForm, modelo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Tipo</label>
              <select value={vForm.tipo} onChange={e => setVForm({ ...vForm, tipo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm mt-1">
                <option value="utilitario">Utilitario</option>
                <option value="camion">Camión</option>
                <option value="camioneta">Camioneta</option>
                <option value="moto">Moto</option>
              </select>
            </div>
          </div>
          <button onClick={createVehiculo} disabled={saving || !vForm.patente}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm">
            {saving ? 'Guardando...' : 'Guardar Vehículo'}
          </button>
        </div>
      )}

      {/* Routes */}
      {tab === 'rutas' && (
        <div className="space-y-3">
          {rutas.map(r => (
            <div key={r.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-4">
                <Navigation className="w-5 h-5 text-teal-400" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{r.conductor || 'Sin conductor'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${estadoRuta(r.estado)}`}>{r.estado}</span>
                  </div>
                  <p className="text-xs text-slate-500">{r.fecha} · {r.paradas} paradas · {r.km_total} km</p>
                </div>
                {r.estado === 'planificada' && (
                  <button onClick={() => updateRutaEstado(r.id, 'en_curso')}
                    className="px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded text-xs">Iniciar</button>
                )}
                {r.estado === 'en_curso' && (
                  <button onClick={() => updateRutaEstado(r.id, 'completada')}
                    className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 rounded text-xs">Completar</button>
                )}
              </div>

              {/* Stops */}
              {r.paradas_list && r.paradas_list.length > 0 && (
                <div className="pl-6 border-l-2 border-slate-700 space-y-2">
                  {r.paradas_list.map(p => (
                    <div key={p.id} className="flex items-center gap-3">
                      {p.estado === 'completada'
                        ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                        : <Clock className="w-4 h-4 text-slate-500" />}
                      <div className="flex-1">
                        <p className="text-sm text-white">{p.orden}. {p.direccion}</p>
                        {p.referencia && <p className="text-xs text-slate-500">{p.referencia}</p>}
                      </div>
                      {p.estado !== 'completada' && r.estado === 'en_curso' && (
                        <button onClick={() => completarParada(p.id)}
                          className="text-xs text-emerald-400 hover:underline">Completar</button>
                      )}
                      {p.hora_llegada && (
                        <span className="text-xs text-slate-500">{new Date(p.hora_llegada).toLocaleTimeString()}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {!rutas.length && <p className="text-center text-slate-500 py-12">No hay rutas registradas</p>}
        </div>
      )}

      {/* Vehicles */}
      {tab === 'vehiculos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehiculos.map(v => (
            <div key={v.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                  {v.tipo === 'moto' ? <Car className="w-5 h-5 text-teal-400" /> : <Truck className="w-5 h-5 text-teal-400" />}
                </div>
                <div>
                  <p className="font-bold text-white">{v.patente}</p>
                  <p className="text-xs text-slate-500">{[v.marca, v.modelo, v.anio].filter(Boolean).join(' ')}</p>
                </div>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${estadoVehiculo(v.estado)}`}>{v.estado}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">KM actual</span>
                <span className="text-white">{v.km_actual.toLocaleString()} km</span>
              </div>
              {v.proximo_service_km > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1"><Wrench className="w-3 h-3" /> Próx. service</span>
                  <span className={v.km_actual >= v.proximo_service_km ? 'text-red-400' : 'text-white'}>
                    {v.proximo_service_km.toLocaleString()} km
                  </span>
                </div>
              )}
            </div>
          ))}
          {!vehiculos.length && <p className="col-span-full text-center text-slate-500 py-12">No hay vehículos registrados</p>}
        </div>
      )}
    </div>
  );
}
