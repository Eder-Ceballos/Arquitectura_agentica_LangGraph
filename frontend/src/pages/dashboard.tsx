import DashboardPage from './DashboardPage';
import { useAuthGuard } from '../hooks/useAuthGuard';

export default function Dashboard() {
  const isAuthenticated = useAuthGuard();
  if (!isAuthenticated) return null;
  return <DashboardPage />;
}