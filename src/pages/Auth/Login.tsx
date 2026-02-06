import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, Loader2, AlertCircle, Mail, CheckCircle, ArrowLeft } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Ingresá tu email para recuperar la contraseña');
      return;
    }
    setError(null);
    setLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
    setLoading(false);
  };

  // Vista de recuperar contraseña
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <button
            onClick={() => {
              setShowForgotPassword(false);
              setResetSent(false);
              setError(null);
            }}
            className="flex items-center text-slate-600 hover:text-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al login
          </button>

          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Recuperar Contraseña</h1>
            <p className="text-slate-600 mt-2 text-center">
              Te enviaremos un email con instrucciones para restablecer tu contraseña
            </p>
          </div>

          {resetSent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Email enviado</h2>
              <p className="text-slate-600 mb-6">
                Revisá tu casilla de correo en <strong>{email}</strong> y seguí las instrucciones para restablecer tu contraseña.
              </p>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSent(false);
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Volver al login
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="tu@email.com"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      Enviar instrucciones
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">SGT</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Sistema de Gestión de Trámites</h1>
          <p className="text-slate-600 mt-2">Inicia sesión para continuar</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            ¿No tienes una cuenta?{' '}
            <button
              onClick={onSwitchToSignUp}
              className="text-blue-600 hover:text-blue-700 font-medium"
              disabled={loading}
            >
              Registrarse
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
