import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, CheckCircle, Loader2 } from 'lucide-react';
import AuthLayout from './components/AuthLayout';
import PasswordInput from './components/PasswordInput';
import AuthAlert from './components/AuthAlert';
import AuthButton from './components/AuthButton';

export default function ResetPassword() {
  const { updatePassword, clearRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      clearRecovery();
      setTimeout(() => { window.location.href = '/'; }, 3000);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Contraseña actualizada</h1>
          <p className="text-sm text-slate-600 mb-4">
            Tu contraseña ha sido cambiada exitosamente. Serás redirigido al inicio...
          </p>
          <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Nueva Contraseña</h1>
        <p className="text-sm text-slate-400 mt-1 text-center">Ingresá tu nueva contraseña</p>
      </div>

      {error && <AuthAlert type="error" message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput label="Nueva contraseña" required value={password} onChange={setPassword} disabled={loading} hint="Mínimo 6 caracteres" />
        <PasswordInput label="Confirmar contraseña" required value={confirmPassword} onChange={setConfirmPassword} disabled={loading} />
        <AuthButton loading={loading}>Guardar nueva contraseña</AuthButton>
      </form>
    </AuthLayout>
  );
}
