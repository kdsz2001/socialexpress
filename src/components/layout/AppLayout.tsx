import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ChevronUp } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ClientsSubheader } from './ClientsSubheader'
import { ProfileSubheader } from './ProfileSubheader'
import { AgendaSubheader } from './AgendaSubheader'
import { EventsSubheader } from './EventsSubheader'
import { ProductsSubheader } from './ProductsSubheader'
import { EmployeesSubheader } from './EmployeesSubheader'
import { OrdersSubheader } from './OrdersSubheader'
import { FinanceiroSubheader } from './FinanceiroSubheader'
import { NewAppointmentModal } from '../agenda/NewAppointmentModal'
import { SaveToast } from '../ui/SaveToast'
import type { Appointment } from '../../lib/agendaStore'
import {
  type NewAppointmentDefaults,
  subscribeAgendaToast,
  subscribeNewAppointmentRequest,
} from '../../lib/agendaUi'
import './AppLayout.css'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/clientes': 'Clientes',
  '/clientes/cadastrar': 'Cadastro de clientes',
  '/meu-perfil': 'Meu perfil',
  '/agenda': 'Agenda',
  '/eventos': 'Eventos',
  '/produtos': 'Produtos',
  '/funcionarios': 'Funcionários',
  '/pedidos': 'Pedidos',
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
    <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
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
        {location.pathname.startsWith('/clientes') && <ClientsSubheader />}
        {location.pathname === '/meu-perfil' && <ProfileSubheader />}
        {location.pathname === '/agenda' && (
          <AgendaSubheader onNewAppointment={() => openNewAppointment()} />
        )}
        {location.pathname === '/eventos' && <EventsSubheader />}
        {location.pathname.startsWith('/produtos') && <ProductsSubheader />}
        {location.pathname.startsWith('/funcionarios') && <EmployeesSubheader />}
        {location.pathname === '/pedidos' && <OrdersSubheader />}
        {location.pathname === '/financeiro' && <FinanceiroSubheader />}
        <main className="app-content" ref={contentRef}>
          <div className="app-content__inner">
            <Outlet />
          </div>
          <footer className="app-footer">2016© Social Express</footer>
        </main>
      </div>

      {location.pathname === '/agenda' ? (
        <>
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
        </>
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
