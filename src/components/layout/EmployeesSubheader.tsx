import { useLocation } from 'react-router-dom'
import { useEmployees } from '../../hooks/useEmployees'
import './ClientsSubheader.css'

export function EmployeesSubheader() {
  const location = useLocation()
  const employees = useEmployees()
  const count = employees.length
  const isForm = location.pathname !== '/funcionarios'

  const countLabel =
    count === 1 ? '1 funcionário cadastrados' : `${count} funcionários cadastrados`

  if (isForm) {
    return (
      <header className="clients-subheader">
        <div className="clients-subheader__heading">
          <h1 className="clients-subheader__title">Cadastro de funcionários</h1>
        </div>
      </header>
    )
  }

  return (
    <header className="clients-subheader">
      <div className="clients-subheader__heading">
        <h1 className="clients-subheader__title">Funcionários</h1>
        <span className="clients-subheader__sep" aria-hidden="true" />
        <p className="clients-subheader__subtitle">{countLabel}</p>
      </div>
    </header>
  )
}
