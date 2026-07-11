import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useMyTeams } from '@/features/households/hooks';
import LoginPage from '@/features/auth/LoginPage';
import HouseholdSetupPage from '@/features/households/HouseholdSetupPage';
import InviteAcceptPage from '@/features/households/InviteAcceptPage';
import Layout from '@/components/Layout';
import TodayPage from '@/pages/TodayPage';
import TasksPage from '@/pages/TasksPage';
import ShoppingPage from '@/pages/ShoppingPage';
import StaplesPage from '@/pages/StaplesPage';
import ExpensesPage from '@/pages/ExpensesPage';
import {
  AgendaPage,
  GymPage,
  MembersPage,
  ProfilePage,
  RoutinePage,
  SettingsPage,
} from '@/pages/misc';

function FullScreenSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const myTeams = useMyTeams();

  if (loading) return <FullScreenSpinner />;

  if (!user) {
    return (
      <Routes>
        <Route path="/convite" element={<InviteAcceptPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  if (myTeams.isLoading) return <FullScreenSpinner />;

  if ((myTeams.data ?? []).length === 0) {
    return (
      <Routes>
        <Route path="/convite" element={<InviteAcceptPage />} />
        <Route path="*" element={<HouseholdSetupPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/convite" element={<InviteAcceptPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<TodayPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/tarefas" element={<TasksPage />} />
        <Route path="/compras" element={<ShoppingPage />} />
        <Route path="/contas" element={<ExpensesPage />} />
        <Route path="/academia" element={<GymPage />} />
        <Route path="/rotina" element={<RoutinePage />} />
        <Route path="/membros" element={<MembersPage />} />
        <Route path="/staples" element={<StaplesPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
