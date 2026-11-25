import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export interface NavItem { to: string; label: string; end?: boolean }

/** Casca da aplicação: barra lateral no desktop, menu rolável no celular. */
export default function Layout({ items }: { items: NavItem[] }) {
  const { club, profile, signOut } = useAuth()
  const link = ({ isActive }: { isActive: boolean }) =>
    `block whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-flag text-turf-900' : 'text-white/90 hover:bg-white/10'}`
  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-brand text-white md:w-60 md:min-h-screen md:sticky md:top-0 md:self-start p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          {club?.logo_url && <img src={club.logo_url} alt="" className="h-10 w-10 rounded object-cover bg-white" />}
          <div className="min-w-0">
            <p className="font-display text-xl font-bold leading-tight truncate">{club?.name}</p>
            <p className="text-xs text-white/70 truncate">{profile?.full_name}</p>
          </div>
        </div>
        <nav aria-label="Principal" className="mt-2 flex md:block gap-1 overflow-x-auto md:overflow-visible pb-1">
          {items.map((i) => <NavLink key={i.to} to={i.to} end={i.end} className={link}>{i.label}</NavLink>)}
          <button onClick={signOut} className="block whitespace-nowrap rounded-md px-3 py-2 text-sm text-white/80 hover:bg-white/10 md:mt-6">Sair</button>
        </nav>
      </aside>
      <main className="flex-1 min-w-0 p-4 md:p-8"><Outlet /></main>
    </div>
  )
}
