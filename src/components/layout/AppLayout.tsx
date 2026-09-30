import { lazy, Suspense, useState, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ChevronUp } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { SaveToast } from '../ui/SaveToast'
import type { Appointment } from '../../lib/agendaStore'
import {
  type NewAppointmentDefaults,
  subscribeAgendaToast,
  subscribeNewAppointmentRequest,
} from '../../lib/agendaUi'
import './AppLayout.css'

const ClientsSubheader = lazy(() =>
  import('./ClientsSubheader').then((mod) => ({ default: mod.ClientsSubheader })),
)
const ProfileSubheader = lazy(() =>
  import('./ProfileSubheader').then((mod) => ({ default: mod.ProfileSubheader })),
)
const AgendaSubheader = lazy(() =>
  import('./AgendaSubheader').then((mod) => ({ default: mod.AgendaSubheader })),
)
const EventsSubheader = lazy(() =>
  import('./EventsSubheader').then((mod) => ({ default: mod.EventsSubheader })),
)
const ProductsSubheader = lazy(() =>
  import('./ProductsSubheader').then((mod) => ({ default: mod.ProductsSubheader })),
)
const EmployeesSubheader = lazy(() =>
  import('./EmployeesSubheader').then((mod) => ({ default: mod.EmployeesSubheader })),
)
const OrdersSubheader = lazy(() =>
  import('./OrdersSubheader').then((mod) => ({ default: mod.OrdersSubheader })),
)
const FinanceiroSubheader = lazy(() =>
  import('./FinanceiroSubheader').then((mod) => ({ default: mod.FinanceiroSubheader })),
)
const SuppliersSubheader = lazy(() =>
  import('./SuppliersSubheader').then((mod) => ({ default: mod.SuppliersSubheader })),
)
const ReportsSubheader = lazy(() =>
  import('./ReportsSubheader').then((mod) => ({ default: mod.ReportsSubheader })),
)
const SettingsSubheader = lazy(() =>
  import('./SettingsSubheader').then((mod) => ({ default: mod.SettingsSubheader })),
)
const HistorySubheader = lazy(() =>
  import('./HistorySubheader').then((mod) => ({ default: mod.HistorySubheader })),
)
const CrmSubheader = lazy(() =>
  import('./CrmSubheader').then((mod) => ({ default: mod.CrmSubheader })),
)
const NewAppointmentModal = lazy(() =>
  import('../agenda/NewAppointmentModal').then((mod) => ({ default: mod.NewAppointmentModal })),
)

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/clientes': 'Clientes',
  '/clientes/cadastrar': 'Cadastro de clientes',
  '/meu-perfil': 'Meu perfil',
  '/crm': 'CRM',
  '/agenda': 'Agenda',
  '/eventos': 'Eventos',
  '/produtos': 'Produtos',
  '/produtos/cadastrar': 'Cadastro de produto',
  '/funcionarios': 'Funcionários',
  '/funcionarios/cadastrar': 'Cadastro de funcionários',
  '/pedidos': 'Pedidos',
  '/pedidos/novo': 'Novo pedido',
  '/orcamentos': 'Orçamentos',
  '/financeiro': 'Financeiro',
  '/fornecedores': 'Fornecedores',
  '/relatorios': 'Relatórios',
  '/configuracoes': 'Configurações',
  '/historicos': 'Históricos',
}

function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= breakpoint,
  )

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [breakpoint])

  return isMobile
}

export function AppLayout() {
  const isMobile = useIsMobile()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false)
  const [appointmentDefaults, setAppointmentDefaults] = useState<NewAppointmentDefaults>({})
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [agendaToastOpen, setAgendaToastOpen] = useState(false)
  const [agendaToastMessage, setAgendaToastMessage] = useState('')
  const contentRef = useRef<HTMLElement>(null)

  useEffect(() => {
    return subscribeNewAppointmentRequest((request) => {
      if (request.mode === 'edit' && request.appointment) {
        setEditingAppointment(request.appointment)
        setAppointmentDefaults({})
        setNewAppointmentOpen(true)
        return
      }
      setEditingAppointment(null)
      setAppointmentDefaults(request.defaults ?? {})
      setNewAppointmentOpen(true)
    })
  }, [])

  useEffect(() => {
    return subscribeAgendaToast((message) => {
      setAgendaToastMessage(message)
      setAgendaToastOpen(true)
    })
  }, [])

  const openNewAppointment = (defaults: NewAppointmentDefaults = {}) => {
    setEditingAppointment(null)
    setAppointmentDefaults(defaults)
    setNewAppointmentOpen(true)
  }

  const closeNewAppointment = () => {
    setNewAppointmentOpen(false)
    setAppointmentDefaults({})
    setEditingAppointment(null)
  }

  useEffect(() => {
    setCollapsed(isMobile)
  }, [isMobile])

  useEffect(() => {
    if (isMobile) setCollapsed(true)
  }, [location.pathname, isMobile])

  useEffect(() => {
    if (location.pathname.startsWith('/clientes/') && location.pathname !== '/clientes/cadastrar') {
      document.title = 'Detalhes do cliente'
      return
    }
    if (
      location.pathname.startsWith('/produtos/') &&
      location.pathname !== '/produtos/cadastrar'
    ) {
      document.title = 'Produto'
      return
    }
    if (location.pathname.startsWith('/funcionarios/') && location.pathname !== '/funcionarios/cadastrar') {
      document.title = 'Cadastro de funcionários'
      return
    }
    document.title = PAGE_TITLES[location.pathname] ?? 'Social Express'
  }, [location.pathname])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const onScroll = () => {
      setShowScrollTop(el.scrollTop > 200)
    }

    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const toggle = () => setCollapsed((v) => !v)

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      className={[
        'app-shell',
        collapsed ? 'is-collapsed' : '',
        location.pathname === '/financeiro' ? 'is-finance' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      {!collapsed && isMobile && (
        <button
          type="button"
          className="app-overlay"
          aria-label="Fechar menu"
          onClick={() => setCollapsed(true)}
        />
      )}
      <div className="app-main">
        <Topbar onMenuClick={toggle} />
        <Suspense fallback={null}>
          {location.pathname.startsWith('/clientes') && <ClientsSubheader />}
          {location.pathname === '/crm' && <CrmSubheader />}
          {location.pathname === '/meu-perfil' && <ProfileSubheader />}
          {location.pathname === '/agenda' && (
            <AgendaSubheader onNewAppointment={() => openNewAppointment()} />
          )}
          {location.pathname.startsWith('/eventos') && <EventsSubheader />}
          {location.pathname.startsWith('/produtos') && <ProductsSubheader />}
          {location.pathname.startsWith('/funcionarios') && <EmployeesSubheader />}
          {location.pathname.startsWith('/pedidos') && <OrdersSubheader />}
          {location.pathname === '/financeiro' && <FinanceiroSubheader />}
          {location.pathname === '/fornecedores' && <SuppliersSubheader />}
          {location.pathname === '/relatorios' && <ReportsSubheader />}
          {location.pathname === '/configuracoes' && <SettingsSubheader />}
          {location.pathname === '/historicos' && <HistorySubheader />}
        </Suspense>
        <main className="app-content" ref={contentRef}>
          <div className="app-content__inner">
            <Suspense fallback={null}>
              <Outlet />
            </Suspense>
          </div>
          {location.pathname === '/financeiro' ? null : (
            <footer className="app-footer">2016© Social Express</footer>
          )}
        </main>
      </div>

      {location.pathname === '/agenda' ? (
        <Suspense fallback={null}>
          <NewAppointmentModal
            open={newAppointmentOpen}
            onClose={closeNewAppointment}
            defaultDate={
              appointmentDefaults.date
                ? new Date(`${appointmentDefaults.date}T12:00:00`)
                : undefined
            }
            defaultStartTime={appointmentDefaults.startTime}
            defaultEndTime={appointmentDefaults.endTime}
            editingAppointment={editingAppointment}
          />
          <SaveToast
            open={agendaToastOpen}
            message={agendaToastMessage}
            onClose={() => setAgendaToastOpen(false)}
          />
        </Suspense>
      ) : null}

      <button
        type="button"
        className={`scrolltop${showScrollTop ? ' is-visible' : ''}`}
        aria-label="Voltar ao topo"
        onClick={scrollToTop}
      >
        <ChevronUp size={22} strokeWidth={2.25} />
      </button>
    </div>
  )
}
