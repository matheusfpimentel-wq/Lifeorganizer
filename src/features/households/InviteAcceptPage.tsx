import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { teams } from '@/lib/appwrite';

/** Aceite do convite nativo do Teams (?teamId&membershipId&userId&secret). */
export default function InviteAcceptPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'working' | 'done' | 'error'>('working');
  const [message, setMessage] = useState('Confirmando convite…');

  useEffect(() => {
    const teamId = params.get('teamId');
    const membershipId = params.get('membershipId');
    const userId = params.get('userId');
    const secret = params.get('secret');
    if (!teamId || !membershipId || !userId || !secret) {
      setStatus('error');
      setMessage('Link de convite inválido.');
      return;
    }
    teams
      .updateMembershipStatus({ teamId, membershipId, userId, secret })
      .then(() => {
        setStatus('done');
        setMessage('Convite aceito! Redirecionando…');
        setTimeout(() => navigate('/'), 1500);
      })
      .catch((err: Error) => {
        setStatus('error');
        setMessage(err.message);
      });
  }, [params, navigate]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">Convite para o lar</h1>
      <p className={status === 'error' ? 'text-red-600' : 'text-slate-500'}>{message}</p>
    </div>
  );
}
