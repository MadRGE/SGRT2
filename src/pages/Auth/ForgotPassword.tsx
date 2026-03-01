import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import AuthLayout from './components/AuthLayout';
import AuthInput from './components/AuthInput';
import AuthAlert from './components/AuthAlert';
import AuthButton from './components/AuthButton';

interface Props {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: Props) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Ingresá tu email para recuperar la contraseña'); return; }
    setError(null);
    setLoading(true);
    const { error } = await resetPassword(email);
    if (error) { setError(error.message); } else { setSent(true); }
    setLoading(false);
  };

  return (
    <AuthLayout>
      <button
        onClick={() => { onBack(); }}
        className="flex items-center text-slate-400 hover:text-slate-600 mb-8 text-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver
      </button>

      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Recuperar Contraseña</h1>
        <p className="text-sm text-slate-400 mt-1 text-center">Te enviamos instrucciones por email</p>
      </div>

      {sent ? (
        <div className="text-center">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-sm text-slate-600 mb-1">Email enviado a</p>
          <p className="text-sm font-semibold text-slate-800 mb-6">{email}</p>
          <button onClick={onBack} className="text-sm text-blue-600 font-semibold hover:text-blue-700">
            Volver al login
          </button>
        </div>
      ) : (
        <>
          {error && <AuthAlert type="error" message={error} />}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput label="Email" type="email" required value={email} onChange={setEmail} disabled={loading} placeholder="tu@email.com" />
            <AuthButton loading={loading}>Enviar instrucciones</AuthButton>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
