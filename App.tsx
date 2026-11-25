import { Navigate, Route, Routes } from 'react-router-dom'
import { ReactNode } from 'react'
import { useAuth } from './contexts/AuthContext'
import Layout, { NavItem } from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/manager/Dashboard'
import AthletesPage from './pages/manager/AthletesPage'
import PaymentsPage from './pages/manager/PaymentsPage'
import { PlaybooksPage, DrillsPage, PartnersPage } from './pages/manager/ContentPages'
import WorkoutsAdminPage from './pages/manager/WorkoutsAdminPage'
import ClubSettings from './pages/manager/ClubSettings'
import MyProfile from './pages/athlete/MyProfile'
import MyPlaybook from './pages/athlete/MyPlaybook'
import MyDrills from './pages/athlete/MyDrills'
import MyWorkouts from './pages/athlete/MyWorkouts'
import MyPartners from './pages/athlete/MyPartners'

const managerNav: NavItem[] = [
  { to: '/gestor', label: 'Painel', end: true }, { to: '/gestor/atletas', label: 'Atletas' },
  { to: '/gestor/mensalidades', label: 'Mensalidades' }, { to: '/gestor/playbook', label: 'Playbook' },
  { to: '/gestor/drills', label: 'Drills' }, { to: '/gestor/treinos', label: 'Treinos' },
  { to: '/gestor/parceiros', label: 'Parceiros' }, { to: '/gestor/clube', label: 'Clube' },
]
const athleteNav: NavItem[] = [
  { to: '/atleta', label: 'Meu perfil', end: true }, { to: '/atleta/playbook', label: 'Playbook' },
  { to: '/atleta/drills', label: 'Drills' }, { to: '/atleta/treinos', label: 'Treinos' },
  { to: '/atleta/parceiros', label: 'Parceiros' },
]

/** Exige login e o papel correto; senão redireciona. */
function Guard({ role, children }: { role: 'manager' | 'athlete'; children: ReactNode }) {
  const { session, profile, loading, signOut } = useAuth()
  if (loading) return <p className="p-8">Carregando…</p>
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return (
    <div className="p-8 max-w-md">
      <h1 className="text-3xl font-bold">Acesso não liberado</h1>
      <p className="mt-2 text-sm">Seu e-mail ainda não foi cadastrado por nenhum clube. Peça à comissão técnica para incluir você e entre novamente.</p>
      <button className="btn mt-4" onClick={signOut}>Sair</button>
    </div>
  )
  if (profile.role !== role) return <Navigate to={profile.role === 'manager' ? '/gestor' : '/atleta'} replace />
  return <>{children}</>
}

function Home() {
  const { profile, session, loading } = useAuth()
  if (loading) return <p className="p-8">Carregando…</p>
  if (!session) return <Navigate to="/login" replace />
  return <Navigate to={profile?.role === 'athlete' ? '/atleta' : '/gestor'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/gestor" element={<Guard role="manager"><Layout items={managerNav} /></Guard>}>
        <Route index element={<Dashboard />} />
        <Route path="atletas" element={<AthletesPage />} />
        <Route path="mensalidades" element={<PaymentsPage />} />
        <Route path="playbook" element={<PlaybooksPage />} />
        <Route path="drills" element={<DrillsPage />} />
        <Route path="treinos" element={<WorkoutsAdminPage />} />
        <Route path="parceiros" element={<PartnersPage />} />
        <Route path="clube" element={<ClubSettings />} />
      </Route>
      <Route path="/atleta" element={<Guard role="athlete"><Layout items={athleteNav} /></Guard>}>
        <Route index element={<MyProfile />} />
        <Route path="playbook" element={<MyPlaybook />} />
        <Route path="drills" element={<MyDrills />} />
        <Route path="treinos" element={<MyWorkouts />} />
        <Route path="parceiros" element={<MyPartners />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
