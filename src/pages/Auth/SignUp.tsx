import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from './components/AuthLayout';
import AuthInput from './components/AuthInput';
import PasswordInput from './components/PasswordInput';
import AuthAlert from './components/AuthAlert';
import AuthButton from './components/AuthButton';

interface Props {
  onSwitchToLogin: () => void;
}

export default function SignUp({ onSwitchToLogin }: Props) {
  const { signUp } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, nombre, 'despachante');
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => onSwitchToLogin(), 2000);
    }
  };

  const disabled = loading || success;

  return (
    <AuthLayout maxWidth="max-w-md">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
          <span className="text-white font-black text-lg">SG</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Crear Cuenta</h1>
        <p className="text-sm text-slate-400 mt-1">Regístrate para comenzar</p>
      </div>

      {error && <AuthAlert type="error" message={error} />}
      {success && <AuthAlert type="success" message="Cuenta creada exitosamente. Redirigiendo al login..." />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput label="Nombre Completo" required value={nombre} onChange={setNombre} disabled={disabled} placeholder="Juan Pérez" />
        <AuthInput label="Email" type="email" required value={email} onChange={setEmail} disabled={disabled} placeholder="tu@email.com" />
        <PasswordInput label="Contraseña" required value={password} onChange={setPassword} disabled={disabled} hint="Mínimo 6 caracteres" />
        <PasswordInput label="Confirmar Contraseña" required value={confirmPassword} onChange={setConfirmPassword} disabled={disabled} />
        <AuthButton loading={loading} disabled={success}>Crear Cuenta</AuthButton>
      </form>

      <p className="mt-6 text-center text-[13px] text-slate-400">
        ¿Ya tenés cuenta?{' '}
        <button onClick={onSwitchToLogin} className="text-blue-600 font-semibold hover:text-blue-700" disabled={disabled}>
          Iniciar Sesión
        </button>
      </p>
    </AuthLayout>
  );
}
