import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { Clients } from './pages/Clients'
import { ClientCreate } from './pages/ClientCreate'
import { ClientDetail } from './pages/ClientDetail'
import { MyProfile } from './pages/MyProfile'
import { Agenda } from './pages/Agenda'
import { Events } from './pages/Events'
import { Products } from './pages/Products'
import { PlaceholderPage } from './pages/PlaceholderPage'

const pages = [
  { path: '/funcionarios', title: 'Funcionários' },
  { path: '/pedidos', title: 'Pedidos' },
  { path: '/financeiro', title: 'Financeiro' },
  { path: '/fornecedores', title: 'Fornecedores' },
  { path: '/relatorios', title: 'Relatórios' },
  { path: '/configuracoes', title: 'Configurações' },
  { path: '/historicos', title: 'Históricos' },
] as const

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="/clientes" element={<Clients />} />
        <Route path="/clientes/cadastrar" element={<ClientCreate />} />
        <Route path="/clientes/:clientId" element={<ClientDetail />} />
        <Route path="/meu-perfil" element={<MyProfile />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/eventos" element={<Events />} />
        <Route path="/produtos" element={<Products />} />
        {pages.map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={<PlaceholderPage title={page.title} />}
          />
        ))}
      </Route>
    </Routes>
  )
}
