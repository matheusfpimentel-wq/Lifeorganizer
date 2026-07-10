import { useState, type FormEvent } from 'react';
import { useCreateHousehold } from './hooks';

/** Primeiro acesso sem lar: criar (convites chegam por e-mail). */
export default function HouseholdSetupPage() {
  const createHousehold = useCreateHousehold();
  const [name, setName] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createHousehold.mutate({ name });
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Bem-vindo(a) ao Morada!</h1>
        <p className="mt-2 text-slate-500">
          Crie o seu lar para começar. Se você foi convidado(a), abra o link do convite recebido
          por e-mail.
        </p>
      </div>
      <form className="card flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="label" htmlFor="householdName">Nome do lar</label>
          <input
            id="householdName"
            className="input"
            placeholder="ex.: Casa da Praia, Ap 42..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={128}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={createHousehold.isPending}>
          {createHousehold.isPending ? 'Criando…' : 'Criar lar'}
        </button>
        {createHousehold.isError && (
          <p className="text-sm text-red-600">{(createHousehold.error as Error).message}</p>
        )}
      </form>
    </div>
  );
}
