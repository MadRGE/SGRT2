import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from './components/AuthLayout';
import AuthInput from './components/AuthInput';
import PasswordInput from './components/PasswordInput';
import AuthAlert from './components/AuthAlert';
import AuthButton from './components/AuthButton';

interface Props {
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword: () => void;
}

export default function Login({ onSwitchToSignUp, onSwitchToForgotPassword }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
          <span className="text-white font-black text-lg">SG</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Bienvenido a SGT</h1>
        <p className="text-sm text-slate-400 mt-1">Sistema de Gestión de Trámites</p>
      </div>

      {error && <AuthAlert type="error" message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput label="Email" type="email" required value={email} onChange={setEmail} disabled={loading} placeholder="tu@email.com" />
        <PasswordInput
          label="Contraseña"
          required
          value={password}
          onChange={setPassword}
          disabled={loading}
          rightLabel={
            <button type="button" onClick={onSwitchToForgotPassword} className="text-[12px] text-blue-600 hover:text-blue-700 font-medium">
              ¿Olvidaste?
            </button>
          }
        />
        <AuthButton loading={loading}>Iniciar Sesión</AuthButton>
      </form>

      <p className="mt-6 text-center text-[13px] text-slate-400">
        ¿No tenés cuenta?{' '}
        <button onClick={onSwitchToSignUp} className="text-blue-600 font-semibold hover:text-blue-700" disabled={loading}>
          Registrate
        </button>
      </p>
    </AuthLayout>
  );
}
