import { useEmployees } from '../../hooks/useEmployees'
import './ClientsSubheader.css'

export function EmployeesSubheader() {
  const employees = useEmployees()
  const count = employees.length

  const countLabel =
    count === 0
      ? 'Nenhum funcionário cadastrado'
      : count === 1
        ? '1 funcionário cadastrado'
        : `${count} funcionários cadastrados`

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
