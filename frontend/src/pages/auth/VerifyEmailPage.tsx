import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth.service';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Lien de vérification invalide : aucun token fourni.');
      return;
    }

    // Empêcher le double appel en React StrictMode (dev)
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setStatus('success');
        setMessage('Votre adresse email a été vérifiée avec succès !');
      } catch (err: any) {
        setStatus('error');
        setMessage(
          err.response?.data?.message || 'Le lien de vérification est invalide ou a expiré.'
        );
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="text-5xl mb-4 animate-spin">⏳</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Vérification en cours...</h2>
              <p className="text-gray-600">Veuillez patienter pendant que nous vérifions votre email.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email vérifié</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Se connecter
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur de vérification</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-medium transition"
              >
                Retour à la connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
