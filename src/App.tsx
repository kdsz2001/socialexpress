import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { Clients } from './pages/Clients'
import { ClientCreate } from './pages/ClientCreate'
import { PlaceholderPage } from './pages/PlaceholderPage'

const pages = [
  { path: '/agenda', title: 'Agenda' },
  { path: '/eventos', title: 'Eventos' },
  { path: '/produtos', title: 'Produtos' },
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
