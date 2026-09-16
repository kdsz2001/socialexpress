import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProductAttributes } from '../hooks/useProductAttributes'
import { useProductTypes } from '../hooks/useProductTypes'
import { addProduct } from '../lib/productsStore'
import './Products.css'
import './ProductCreate.css'

export function ProductCreate() {
  const navigate = useNavigate()
  const types = useProductTypes()
  const colors = useProductAttributes('cor')
  const sizes = useProductAttributes('tamanho')
  const models = useProductAttributes('modelo')
  const brands = useProductAttributes('marca')
  const stylists = useProductAttributes('estilista')
  const events = useProductAttributes('evento')

  const [productType, setProductType] = useState('')
  const [fullCode, setFullCode] = useState('')
  const [storeCode, setStoreCode] = useState('')
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [model, setModel] = useState('')
  const [brand, setBrand] = useState('')
  const [stylist, setStylist] = useState('')
  const [eventType, setEventType] = useState('')
  const [cost, setCost] = useState('')
  const [rental, setRental] = useState('')
  const [firstRental, setFirstRental] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [ncm, setNcm] = useState('')
  const [cfop, setCfop] = useState('')
  const [cfopInter, setCfopInter] = useState('')
  const [commission, setCommission] = useState('')
  const [touched, setTouched] = useState(false)

  const missingType = !productType
  const missingName = !name.trim()
  const missingRental = !rental.trim()

  const attributeSummary = useMemo(() => {
    return [color, size, model, brand, stylist, eventType].filter(Boolean).join(', ')
  }, [color, size, model, brand, stylist, eventType])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (missingType || missingName || missingRental) return

    addProduct({
      name,
      type: productType,
      rental: rental.startsWith('R$') ? rental : `R$ ${rental}`,
      attributes: attributeSummary,
      status: 'ativo',
    })
    navigate('/produtos')
  }

  return (
    <div className="product-create">
      <form className="product-create__card" onSubmit={onSubmit}>
        <header className="product-create__head">
          <h2>Informações do produto</h2>
          <div className="product-create__actions">
            <button
              type="button"
              className="product-create__back"
              onClick={() => navigate('/produtos')}
            >
              <ArrowLeft size={16} strokeWidth={2.25} />
              Voltar
            </button>
            <button type="submit" className="product-create__save">
              <Check size={16} strokeWidth={2.5} />
              Cadastrar
            </button>
          </div>
        </header>

        <div className="product-create__body">
          <Field
            label="Tipo de produto"
            required
            invalid={touched && missingType}
          >
            <select
              value={productType}
              onChange={(event) => setProductType(event.target.value)}
            >
              <option value="">Selecione um tipo de produto</option>
              {types.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Código completo">
            <input
              type="text"
              value={fullCode}
              onChange={(event) => setFullCode(event.target.value)}
            />
            <button type="button" className="product-create__link">
              Clique aqui se você quiser escolher um ID específico para o produto.
            </button>
          </Field>

          <Field label="Código loja">
            <input
              type="text"
              value={storeCode}
              onChange={(event) => setStoreCode(event.target.value)}
            />
            <p className="product-create__help">
              É um código identificador alternativo ao código gerado pelo sistema.{' '}
              <button type="button" className="product-create__link">
                Clique aqui para saber mais
              </button>
            </p>
          </Field>

          <Field label="Nome" required invalid={touched && missingName}>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

          <Field label="Quantidade">
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </Field>

          <Field label="Cor">
            <select value={color} onChange={(event) => setColor(event.target.value)}>
              <option value="">Selecione uma cor</option>
              {colors.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tamanho">
            <select value={size} onChange={(event) => setSize(event.target.value)}>
              <option value="">Selecione uma tamanho</option>
              {sizes.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Modelo">
            <select value={model} onChange={(event) => setModel(event.target.value)}>
              <option value="">Selecione um modelo</option>
              {models.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Marca">
            <select value={brand} onChange={(event) => setBrand(event.target.value)}>
              <option value="">Selecione uma marca</option>
              {brands.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Estilista">
            <select value={stylist} onChange={(event) => setStylist(event.target.value)}>
              <option value="">Selecione um estilista</option>
              {stylists.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tipos de evento">
            <select value={eventType} onChange={(event) => setEventType(event.target.value)}>
              <option value="">Selecione um tipo de evento</option>
              {events.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Custo">
            <div className="product-create__money">
              <span>R$</span>
              <input
                type="text"
                value={cost}
                onChange={(event) => setCost(event.target.value)}
              />
            </div>
          </Field>

          <Field label="Aluguel" required invalid={touched && missingRental}>
            <div className="product-create__money">
              <span>R$</span>
              <input
                type="text"
                value={rental}
                onChange={(event) => setRental(event.target.value)}
              />
            </div>
          </Field>

          <Field label="Preço primeiro aluguel">
            <div className="product-create__money">
              <span>R$</span>
              <input
                type="text"
                value={firstRental}
                onChange={(event) => setFirstRental(event.target.value)}
              />
            </div>
            <p className="product-create__help">
              Esse valor será considerado somente quando for a sua primeira locação.
            </p>
          </Field>

          <Field label="Preço de venda">
            <div className="product-create__money">
              <span>R$</span>
              <input
                type="text"
                value={salePrice}
                onChange={(event) => setSalePrice(event.target.value)}
              />
            </div>
          </Field>

          <Field label="Código NCM">
            <input type="text" value={ncm} onChange={(event) => setNcm(event.target.value)} />
          </Field>

          <Field label="Código CFOP">
            <input type="text" value={cfop} onChange={(event) => setCfop(event.target.value)} />
          </Field>

          <Field label="Código CFOP Venda Interestadual">
            <input
              type="text"
              value={cfopInter}
              onChange={(event) => setCfopInter(event.target.value)}
            />
          </Field>

          <Field label="Comissão vendedor">
            <div className="product-create__money product-create__money--pct">
              <input
                type="text"
                value={commission}
                onChange={(event) => setCommission(event.target.value)}
              />
              <span>%</span>
            </div>
          </Field>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  required,
  invalid,
  children,
}: {
  label: string
  required?: boolean
  invalid?: boolean
  children: ReactNode
}) {
  return (
    <label className={`product-create__row${invalid ? ' is-invalid' : ''}`}>
      <span className="product-create__label">
        {label}
        {required ? <em>*</em> : null}
      </span>
      <div className="product-create__control">{children}</div>
    </label>
  )
}
