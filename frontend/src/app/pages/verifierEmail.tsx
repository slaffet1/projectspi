import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

export default function VerifyEmail() {
  const [message, setMessage] = useState('Vérification en cours...');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      api.get(`/users/verify-email?token=${token}`)
        .then(() => setMessage('Email vérifié avec succès ! Vous pouvez vous connecter.'))
        .catch(() => setMessage('Le token est invalide ou expiré.'));
    } else {
      setMessage('Token manquant.');
    }
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Vérification d’email</h2>
        <p className="text-gray-700">{message}</p>
        {message.includes('succès') && (
          <a
            href="/login"
            className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Se connecter
          </a>
        )}
      </div>
    </div>
  );
}