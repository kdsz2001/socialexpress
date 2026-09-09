import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated, subscribeAuth } from '../../lib/authStore'

/** Protege o app autenticado; redireciona para /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [authed, setAuthed] = useState(() => isAuthenticated())

  useEffect(() => subscribeAuth(() => setAuthed(isAuthenticated())), [])

  if (!authed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
