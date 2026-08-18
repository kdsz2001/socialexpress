import { getUserDisplayName, getUserProfile } from '../../lib/userProfileStore'
import './ClientsSubheader.css'

export function ProfileSubheader() {
  const name = getUserDisplayName(getUserProfile())

  return (
    <header className="clients-subheader">
      <div className="clients-subheader__heading">
        <h1 className="clients-subheader__title">Meu perfil</h1>
        <span className="clients-subheader__sep" aria-hidden="true" />
        <p className="clients-subheader__subtitle">{name}</p>
      </div>
    </header>
  )
}
