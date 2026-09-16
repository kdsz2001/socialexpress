import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CreatableSelect } from '../components/products/CreatableSelect'
import {
  ProductPhotoField,
  ProductSwitch,
} from '../components/products/ProductFormControls'
import { ProductTypeModal } from '../components/products/ProductTypeModal'
import { useProductAttributes } from '../hooks/useProductAttributes'
import { useProductTypes } from '../hooks/useProductTypes'
import { addProductAttribute, type ProductAttributeKind } from '../lib/productAttributesStore'
import { formatMoneyBrPrefix, maskMoneyBr } from '../lib/moneyMask'
import { addProduct, nextFullCodeForType } from '../lib/productsStore'
import {
  addProductType,
  formatProductTypeLabel,
  nextProductTypeCode,
} from '../lib/productTypesStore'
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
  const [customId, setCustomId] = useState(false)
  const [customSequence, setCustomSequence] = useState('')
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
  const [photoName, setPhotoName] = useState<string | null>(null)
  const [photoDataUrl, setPhotoDataUrl] = useState('')
  const [description, setDescription] = useState('')
  const [consigned, setConsigned] = useState(false)
  const [consignedCommission, setConsignedCommission] = useState('')
  const [serviceFee, setServiceFee] = useState('')
  const [productState, setProductState] = useState('')
  const [statusAtivo, setStatusAtivo] = useState(true)
  const [touched, setTouched] = useState(false)
  const [typeModalOpen, setTypeModalOpen] = useState(false)
  const [typeModalName, setTypeModalName] = useState('')
  const [typeModalDescription, setTypeModalDescription] = useState('')

  const missingType = !productType
  const missingName = !name.trim()
  const missingRental = !rental.trim()

  const typeOptions = useMemo(() => types.map((item) => formatProductTypeLabel(item)), [types])
  const colorOptions = useMemo(() => colors.map((item) => item.name), [colors])
  const sizeOptions = useMemo(() => sizes.map((item) => item.name), [sizes])
  const modelOptions = useMemo(() => models.map((item) => item.name), [models])
  const brandOptions = useMemo(() => brands.map((item) => item.name), [brands])
  const stylistOptions = useMemo(() => stylists.map((item) => item.name), [stylists])
  const eventOptions = useMemo(() => events.map((item) => item.name), [events])

  const autoCode = useMemo(() => nextFullCodeForType(productType), [productType, types])
  const codePrefix = autoCode.prefix
  const codeSequence = customId ? customSequence : autoCode.sequence
  const resolvedFullCode =
    codePrefix && codeSequence ? `${codePrefix}${codeSequence.replace(/\D/g, '')}` : ''

  useEffect(() => {
    if (!customId) return
    setCustomSequence(autoCode.sequence)
  }, [productType, customId, autoCode.sequence])

  const attributeSummary = useMemo(() => {
    return [color, size, model, brand, stylist, eventType].filter(Boolean).join(', ')
  }, [color, size, model, brand, stylist, eventType])

  const createAttr = (kind: ProductAttributeKind, value: string) => {
    addProductAttribute(kind, value)
  }

  const openTypeModal = (draftName: string) => {
    setTypeModalName(draftName)
    setTypeModalDescription('')
    setTypeModalOpen(true)
  }

  const saveTypeModal = () => {
    if (!typeModalName.trim()) return
    const created = addProductType(typeModalName, typeModalDescription)
    setProductType(formatProductTypeLabel(created))
    setCustomId(false)
    setTypeModalOpen(false)
  }

  const onProductTypeChange = (value: string) => {
    setProductType(value)
    setCustomId(false)
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (missingType || missingName || missingRental) return

    addProduct({
      name,
      type: productType,
      rental: formatMoneyBrPrefix(rental),
      attributes: attributeSummary,
      status: statusAtivo ? 'ativo' : 'inativo',
      fullCode: resolvedFullCode || undefined,
      storeCode,
      quantity,
      color,
      size,
      model,
      brand,
      stylist,
      eventType,
      cost: formatMoneyBrPrefix(cost),
      firstRental: formatMoneyBrPrefix(firstRental),
      salePrice: formatMoneyBrPrefix(salePrice),
      ncm,
      cfop,
      cfopInter,
      commission,
      description,
      consigned: consigned ? 'Sim' : 'Não',
      consignedCommission,
      serviceFee: formatMoneyBrPrefix(serviceFee),
      productState,
      photoName: photoName ?? '',
      photoDataUrl,
    })
    navigate('/produtos')
  }

  const nextTypeCode = nextProductTypeCode()

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
              <ArrowLeft size={14} strokeWidth={2.25} />
              Voltar
            </button>
            <button type="submit" className="product-create__save">
              <Check size={14} strokeWidth={2.5} />
              Cadastrar
            </button>
          </div>
        </header>

        <div className="product-create__body">
          <Field label="Tipo de produto" required invalid={touched && missingType}>
            <CreatableSelect
              value={productType}
              options={typeOptions}
              placeholder="Selecione um tipo de produto"
              createLabel="Cadastrar novo tipo de produto"
              invalid={touched && missingType}
              selectOnCreate={false}
              onChange={onProductTypeChange}
              onCreate={openTypeModal}
            />
          </Field>

          <Field label="Código completo">
            <div className={`product-create__code${customId ? ' is-custom' : ''}`}>
              <span className="product-create__code-prefix" aria-label="Prefixo do tipo">
                {codePrefix || '-'}
              </span>
              {customId ? (
                <input
                  type="text"
                  inputMode="numeric"
                  className="product-create__code-seq"
                  value={customSequence}
                  onChange={(event) =>
                    setCustomSequence(event.target.value.replace(/\D/g, '').slice(0, 8))
                  }
                  aria-label="ID do produto"
                />
              ) : (
                <span className="product-create__code-seq" aria-label="ID do produto">
                  {codeSequence || '-'}
                </span>
              )}
            </div>
            {!customId ? (
              <button
                type="button"
                className="product-create__link"
                onClick={() => {
                  setCustomSequence(autoCode.sequence || '0001')
                  setCustomId(true)
                }}
              >
                Clique aqui se você quiser escolher um ID específico para o produto.
              </button>
            ) : (
              <button
                type="button"
                className="product-create__link"
                onClick={() => setCustomId(false)}
              >
                Usar ID gerado automaticamente.
              </button>
            )}
          </Field>

          <Field label="Código loja">
            <input
              type="text"
              value={storeCode}
              onChange={(event) => setStoreCode(event.target.value)}
            />
            <p className="product-create__help">
              É um código identificador alternativo ao código gerado pelo sistema.{' '}
              <button type="button" className="product-create__link product-create__link--inline">
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
            <CreatableSelect
              value={color}
              options={colorOptions}
              placeholder="Selecione uma cor"
              createLabel="Cadastrar nova cor"
              onChange={setColor}
              onCreate={(value) => createAttr('cor', value)}
            />
          </Field>

          <Field label="Tamanho">
            <CreatableSelect
              value={size}
              options={sizeOptions}
              placeholder="Selecione um tamanho"
              createLabel="Cadastrar novo tamanho"
              onChange={setSize}
              onCreate={(value) => createAttr('tamanho', value)}
            />
          </Field>

          <Field label="Modelo">
            <CreatableSelect
              value={model}
              options={modelOptions}
              placeholder="Selecione um modelo"
              createLabel="Cadastrar novo modelo"
              onChange={setModel}
              onCreate={(value) => createAttr('modelo', value)}
            />
          </Field>

          <Field label="Marca">
            <CreatableSelect
              value={brand}
              options={brandOptions}
              placeholder="Selecione uma marca"
              createLabel="Cadastrar nova marca"
              onChange={setBrand}
              onCreate={(value) => createAttr('marca', value)}
            />
          </Field>

          <Field label="Estilista">
            <CreatableSelect
              value={stylist}
              options={stylistOptions}
              placeholder="Selecione um estilista"
              createLabel="Cadastrar novo estilista"
              onChange={setStylist}
              onCreate={(value) => createAttr('estilista', value)}
            />
          </Field>

          <Field label="Tipos de evento">
            <CreatableSelect
              value={eventType}
              options={eventOptions}
              placeholder="Selecione um tipo de evento"
              createLabel="Cadastrar novo tipo de evento"
              onChange={setEventType}
              onCreate={(value) => createAttr('evento', value)}
            />
          </Field>

          <Field label="Custo">
            <MoneyInput value={cost} onChange={setCost} />
          </Field>

          <Field label="Aluguel" required invalid={touched && missingRental}>
            <MoneyInput value={rental} onChange={setRental} invalid={touched && missingRental} />
          </Field>

          <Field label="Preço primeiro aluguel">
            <MoneyInput value={firstRental} onChange={setFirstRental} />
            <p className="product-create__help">
              Esse valor será considerado somente quando for a sua primeira locação.
            </p>
          </Field>

          <Field label="Preço de venda">
            <MoneyInput value={salePrice} onChange={setSalePrice} />
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
            <PercentInput value={commission} onChange={setCommission} />
            <p className="product-create__help">
              Este commissionamento poderá sobrescrever o commissionamento de vendedores.
            </p>
          </Field>

          <Field label="Foto do produto">
            <ProductPhotoField
              photoDataUrl={photoDataUrl}
              onChange={({ dataUrl, name: fileName }) => {
                setPhotoDataUrl(dataUrl)
                setPhotoName(fileName || null)
              }}
            />
          </Field>

          <Field label="Descrição">
            <textarea
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>

          <Field label="Status">
            <ProductSwitch
              on={statusAtivo}
              onLabel="Ativo"
              offLabel="Inativo"
              ariaLabel="Status do produto"
              onToggle={() => setStatusAtivo((value) => !value)}
            />
          </Field>

          <Field label="É um produto consignado?">
            <ProductSwitch
              on={consigned}
              onLabel="Sim"
              offLabel="Não"
              ariaLabel="Produto consignado"
              onToggle={() => setConsigned((value) => !value)}
            />
          </Field>

          <Field label="Comissão do consignado">
            <PercentInput value={consignedCommission} onChange={setConsignedCommission} />
          </Field>

          <Field label="Taxa de serviço">
            <MoneyInput value={serviceFee} onChange={setServiceFee} />
          </Field>

          <Field label="Estado do produto">
            <input
              type="text"
              value={productState}
              onChange={(event) => setProductState(event.target.value)}
            />
          </Field>
        </div>

        <footer className="product-create__footer">
          <button
            type="button"
            className="product-create__back"
            onClick={() => navigate('/produtos')}
          >
            <ArrowLeft size={14} strokeWidth={2.25} />
            Voltar
          </button>
          <button type="submit" className="product-create__save">
            <Check size={14} strokeWidth={2.5} />
            Cadastrar
          </button>
        </footer>
      </form>

      {typeModalOpen ? (
        <ProductTypeModal
          title="Novo tipo de produto"
          tip={
            <>
              O código deste novo tipo será <strong>{nextTypeCode}</strong>.
            </>
          }
          name={typeModalName}
          description={typeModalDescription}
          saveLabel="Cadastrar"
          onNameChange={setTypeModalName}
          onDescriptionChange={setTypeModalDescription}
          onClose={() => setTypeModalOpen(false)}
          onSave={saveTypeModal}
        />
      ) : null}
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
    <div className={`product-create__row${invalid ? ' is-invalid' : ''}`}>
      <div className="product-create__label">
        {label}
        {required ? <em>*</em> : null}
      </div>
      <div className="product-create__control">{children}</div>
    </div>
  )
}

function MoneyInput({
  value,
  onChange,
  invalid,
}: {
  value: string
  onChange: (value: string) => void
  invalid?: boolean
}) {
  return (
    <div className={`product-create__addon${invalid ? ' is-invalid' : ''}`}>
      <span>R$</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(maskMoneyBr(event.target.value))}
        placeholder="0,00"
      />
    </div>
  )
}

function PercentInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="product-create__addon product-create__addon--suffix">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(maskMoneyBr(event.target.value))}
        placeholder="0,00"
      />
      <span>%</span>
    </div>
  )
}
