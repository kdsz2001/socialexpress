import { useLocation, useSearchParams } from 'react-router-dom'
import {
  getUserDisplayName,
  getUserProfile,
  subscribeUserProfile,
} from '../../lib/userProfileStore'
import { useEffect, useState } from 'react'
import './ClientsSubheader.css'

function profilePageTitle(tab: string | null) {
  if (tab === 'preferencias') return 'Minhas preferências'
  return 'Meu perfil'
}

export function ProfileSubheader() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [name, setName] = useState(() => getUserDisplayName(getUserProfile()))
  const title = profilePageTitle(searchParams.get('tab'))

  useEffect(() => {
    setName(getUserDisplayName(getUserProfile()))
    return subscribeUserProfile(() => {
      setName(getUserDisplayName(getUserProfile()))
    })
  }, [location.pathname, searchParams])

  return (
    <header className="clients-subheader">
      <div className="clients-subheader__heading">
        <h1 className="clients-subheader__title">{title}</h1>
        <span className="clients-subheader__sep" aria-hidden="true" />
        <p className="clients-subheader__subtitle">{name}</p>
      </div>
    </header>
  )
}
