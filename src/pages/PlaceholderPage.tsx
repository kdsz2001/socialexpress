import './PlaceholderPage.css'

type PlaceholderPageProps = {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="placeholder-page">
      <h1>{title}</h1>
      <p>Módulo em desenvolvimento.</p>
    </div>
  )
}
