import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, Building2, ArrowLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
  onViewCliente: (clienteId: string) => void;
}

interface Cliente {
  id: string;
  razon_social: string;
  cuit: string;
  email: string | null;
  telefono: string | null;
  proyectos_count?: number;
}

export default function Clientes({ onBack, onViewCliente }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewClienteForm, setShowNewClienteForm] = useState(false);

  useEffect(() => {
    loadClientes();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClientes(clientes);
    } else {
      const filtered = clientes.filter(
        (c) =>
          c.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.cuit.includes(searchTerm) ||
          c.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClientes(filtered);
    }
  }, [searchTerm, clientes]);

  const loadClientes = async () => {
    setLoading(true);

    const { data: clientesData } = await supabase
      .from('clientes')
      .select('*')
      .order('razon_social', { ascending: true });

    if (clientesData) {
      const clientesWithCount = await Promise.all(
        clientesData.map(async (cliente) => {
          const { count } = await supabase
            .from('proyectos')
            .select('*', { count: 'exact', head: true })
            .eq('cliente_id', cliente.id);

          return { ...cliente, proyectos_count: count || 0 };
        })
      );

      setClientes(clientesWithCount);
      setFilteredClientes(clientesWithCount);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver al Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Gestión de Clientes</h1>
            <p className="text-slate-600 mt-1">CRM y seguimiento de cartera de clientes</p>
          </div>
          <button
            onClick={() => setShowNewClienteForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Cliente
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por razón social, CUIT o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {showNewClienteForm && (
          <NewClienteForm
            onClose={() => setShowNewClienteForm(false)}
            onSuccess={() => {
              setShowNewClienteForm(false);
              loadClientes();
            }}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>{searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">
                    Razón Social
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">CUIT</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Email</th>
                  <th className="p-3 text-left text-sm font-medium text-slate-700">Teléfono</th>
                  <th className="p-3 text-center text-sm font-medium text-slate-700">
                    Proyectos
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    onClick={() => onViewCliente(cliente.id)}
                    className="border-t border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="p-3">
                      <p className="font-medium text-blue-700">{cliente.razon_social}</p>
                    </td>
                    <td className="p-3 text-sm text-slate-700">{cliente.cuit}</td>
                    <td className="p-3 text-sm text-slate-600">{cliente.email || '-'}</td>
                    <td className="p-3 text-sm text-slate-600">{cliente.telefono || '-'}</td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {cliente.proyectos_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function NewClienteForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    razon_social: '',
    cuit: '',
    email: '',
    telefono: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from('clientes').insert([
      {
        razon_social: formData.razon_social,
        cuit: formData.cuit,
        email: formData.email || null,
        telefono: formData.telefono || null
      }
    ]);

    if (!error) {
      onSuccess();
    }

    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Nuevo Cliente</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Razón Social *
              </label>
              <input
                type="text"
                required
                value={formData.razon_social}
                onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">CUIT *</label>
              <input
                type="text"
                required
                value={formData.cuit}
                onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                placeholder="30-12345678-9"
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono</label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
