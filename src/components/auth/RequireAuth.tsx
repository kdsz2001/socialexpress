import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated, subscribeAuth } from '../../lib/authStore'

/** Protege o app autenticado; redireciona para /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(() => isAuthenticated())

  useEffect(() => subscribeAuth(() => setAuthed(isAuthenticated())), [])

  if (!authed) {
    return <Navigate to="/login" replace />
  }

  return children
}
