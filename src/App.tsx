import { lazy, type ComponentType } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { RequireAuth } from './components/auth/RequireAuth'
import { PlaceholderPage } from './pages/PlaceholderPage'

function lazyPage<P>(factory: () => Promise<Record<string, ComponentType<P>>>, name: string) {
  return lazy(() => factory().then((mod) => ({ default: mod[name] })))
}

const Login = lazyPage(() => import('./pages/Login'), 'Login')
const CrmCapture = lazyPage(() => import('./pages/CrmCapture'), 'CrmCapture')
const Dashboard = lazyPage(() => import('./pages/Dashboard'), 'Dashboard')
const Clients = lazyPage(() => import('./pages/Clients'), 'Clients')
const ClientCreate = lazyPage(() => import('./pages/ClientCreate'), 'ClientCreate')
const ClientDetail = lazyPage(() => import('./pages/ClientDetail'), 'ClientDetail')
const MyProfile = lazyPage(() => import('./pages/MyProfile'), 'MyProfile')
const Agenda = lazyPage(() => import('./pages/Agenda'), 'Agenda')
const Events = lazyPage(() => import('./pages/Events'), 'Events')
const EventForm = lazyPage(() => import('./pages/EventForm'), 'EventForm')
const Products = lazyPage(() => import('./pages/Products'), 'Products')
const ProductCreate = lazyPage(() => import('./pages/ProductCreate'), 'ProductCreate')
const ProductEdit = lazyPage(() => import('./pages/ProductEdit'), 'ProductEdit')
const Employees = lazyPage(() => import('./pages/Employees'), 'Employees')
const EmployeeForm = lazyPage(() => import('./pages/EmployeeForm'), 'EmployeeForm')
const Orders = lazyPage(() => import('./pages/Orders'), 'Orders')
const OrderCreate = lazyPage(() => import('./pages/OrderCreate'), 'OrderCreate')
const Financeiro = lazyPage(() => import('./pages/Financeiro'), 'Financeiro')
const Suppliers = lazyPage(() => import('./pages/Suppliers'), 'Suppliers')
const Reports = lazyPage(() => import('./pages/Reports'), 'Reports')
const Settings = lazyPage(() => import('./pages/Settings'), 'Settings')
const History = lazyPage(() => import('./pages/History'), 'History')
const Crm = lazyPage(() => import('./pages/Crm'), 'Crm')

const pages = [{ path: '/orcamentos', title: 'Orçamentos' }] as const

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/captura" element={<CrmCapture />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="/clientes" element={<Clients />} />
        <Route path="/clientes/cadastrar" element={<ClientCreate />} />
        <Route path="/clientes/:clientId" element={<ClientDetail />} />
        <Route path="/meu-perfil" element={<MyProfile />} />
        <Route path="/crm" element={<Crm />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/eventos" element={<Events />} />
        <Route path="/eventos/novo" element={<EventForm />} />
        <Route path="/eventos/:eventId" element={<EventForm />} />
        <Route path="/produtos" element={<Products />} />
        <Route path="/produtos/cadastrar" element={<ProductCreate />} />
        <Route path="/produtos/:productId" element={<ProductEdit />} />
        <Route path="/funcionarios" element={<Employees />} />
        <Route path="/funcionarios/cadastrar" element={<EmployeeForm />} />
        <Route path="/funcionarios/:employeeId" element={<EmployeeForm />} />
        <Route path="/pedidos" element={<Orders />} />
        <Route path="/pedidos/novo" element={<OrderCreate />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/fornecedores" element={<Suppliers />} />
        <Route path="/relatorios" element={<Reports />} />
        <Route path="/configuracoes" element={<Settings />} />
        <Route path="/historicos" element={<History />} />
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
