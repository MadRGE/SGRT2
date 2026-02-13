import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, AlertCircle, Mail, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface Props {
  onSwitchToSignUp: () => void;
}

export default function Login({ onSwitchToSignUp }: Props) {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) { setError(error.message); setLoading(false); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Ingresá tu email para recuperar la contraseña'); return; }
    setError(null);
    setLoading(true);
    const { error } = await resetPassword(email);
    if (error) { setError(error.message); } else { setResetSent(true); }
    setLoading(false);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-[400px] w-full">
          <button onClick={() => { setShowForgotPassword(false); setResetSent(false); setError(null); }}
            className="flex items-center text-slate-400 hover:text-slate-600 mb-8 text-sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver
          </button>

          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Recuperar Contraseña</h1>
            <p className="text-sm text-slate-400 mt-1 text-center">Te enviamos instrucciones por email</p>
          </div>

          {resetSent ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm text-slate-600 mb-1">Email enviado a</p>
              <p className="text-sm font-semibold text-slate-800 mb-6">{email}</p>
              <button onClick={() => { setShowForgotPassword(false); setResetSent(false); }}
                className="text-sm text-blue-600 font-semibold hover:text-blue-700">
                Volver al login
              </button>
            </div>
          ) : (
            <>
              {error && <ErrorMsg message={error} />}
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <InputField label="Email" type="email" required value={email} onChange={setEmail} disabled={loading} placeholder="tu@email.com" />
                <button type="submit" disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar instrucciones'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-[400px] w-full">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <span className="text-white font-black text-lg">SG</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Bienvenido a SGT</h1>
          <p className="text-sm text-slate-400 mt-1">Sistema de Gestión de Trámites</p>
        </div>

        {error && <ErrorMsg message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField label="Email" type="email" required value={email} onChange={setEmail} disabled={loading} placeholder="tu@email.com" />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[13px] font-semibold text-slate-700">Contraseña</label>
              <button type="button" onClick={() => setShowForgotPassword(true)} className="text-[12px] text-blue-600 hover:text-blue-700 font-medium">
                ¿Olvidaste?
              </button>
            </div>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                placeholder="••••••••" disabled={loading} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-slate-400">
          ¿No tenés cuenta?{' '}
          <button onClick={onSwitchToSignUp} className="text-blue-600 font-semibold hover:text-blue-700" disabled={loading}>
            Registrate
          </button>
        </p>
      </div>
    </div>
  );
}

function InputField({ label, type, required, value, onChange, disabled, placeholder }: {
  label: string; type: string; required?: boolean; value: string;
  onChange: (v: string) => void; disabled?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
        placeholder={placeholder} disabled={disabled} />
    </div>
  );
}

function ErrorMsg({ message }: { message: string }) {
  return (
    <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
      <p className="text-[13px] text-red-600">{message}</p>
    </div>
  );
}
