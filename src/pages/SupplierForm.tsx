import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, Loader2, Plus, Trash2 } from 'lucide-react'
import { NeighborhoodSelect } from '../components/clients/NeighborhoodSelect'
import {
  addSupplier,
  getSupplier,
  updateSupplier,
  type SupplierAccount,
  type SupplierGender,
  type SupplierInput,
  type SupplierPhone,
  type SupplierPix,
  type SupplierTransfer,
  type SupplierType,
} from '../lib/suppliersStore'
import { isValidCpfCnpj, maskCpfCnpj, onlyDigits } from '../lib/cpfCnpj'
import { BRAZIL_STATES, fetchAddressByCep, maskCep, resolveStateName } from '../lib/brazilAddress'
import { citiesFor, neighborhoodsFor, withCurrent } from './settings/locations'
import './Suppliers.css'

const TOAST_KEY = 'social-express:supplier-toast'

const BANKS = [
  'Banco do Brasil',
  'Bradesco',
  'C6 Bank',
  'Caixa Econômica Federal',
  'NuBank',
  'Santander',
]

const ACCOUNT_TYPES = ['Conta Corrente', 'Poupança']
const PIX_TYPES = ['CPF/CNPJ', 'Celular', 'Email', 'Chave aleatória']

function maskPhone(value: string) {
  const digits = onlyDigits(value, 11)
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  }
  return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

function maskBirthDate(value: string) {
  return onlyDigits(value, 8)
    .replace(/^(\d{2})(\d)/, '$1/$2')
    .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')
}

function emptyPhone(): SupplierPhone {
  return { number: '', principal: false, whatsapp: false }
}

function emptyAccount(): SupplierAccount {
  return { bank: '', accountType: '', agency: '', account: '', operation: '' }
}

function emptyPix(): SupplierPix {
  return { keyType: '', value: '' }
}

const EMPTY: SupplierInput = {
  type: 'Consignado',
  document: '',
  companyName: '',
  companyFantasy: '',
  ie: '',
  im: '',
  gender: '',
  firstName: '',
  lastName: '',
  niceName: '',
  birthDate: '',
  facebook: '',
  instagram: '',
  email: '',
  phones: [emptyPhone()],
  cep: '',
  street: '',
  number: '',
  extra: '',
  state: '',
  city: '',
  district: '',
  transferType: '',
  accounts: [emptyAccount()],
  pixKeys: [emptyPix()],
}

type CepStatus = 'idle' | 'loading' | 'error'
type Errors = Partial<Record<'type' | 'document' | 'companyName' | 'firstName' | 'phone' | 'street' | 'number' | 'state' | 'city' | 'district', string>>

function Field({
  label,
  htmlFor,
  required,
  error,
  start,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  start?: boolean
  children: ReactNode
}) {
  return (
    <div className={`supplier-form__row${start ? ' is-start' : ''}`}>
      {htmlFor ? (
        <label className="supplier-form__label" htmlFor={htmlFor}>
          {label}
          {required ? <span className="supplier-form__req">*</span> : null}
        </label>
      ) : (
        <span className="supplier-form__label">
          {label}
          {required ? <span className="supplier-form__req">*</span> : null}
        </span>
      )}
      <div className="supplier-form__field">
        {children}
        {error ? <p className="supplier-form__error">{error}</p> : null}
      </div>
    </div>
  )
}

export function SupplierForm() {
  const navigate = useNavigate()
  const { supplierId } = useParams()
  const editing = Boolean(supplierId)
  const [draft, setDraft] = useState<SupplierInput>(EMPTY)
  const [ready, setReady] = useState(!editing)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [cepStatus, setCepStatus] = useState<CepStatus>('idle')
  const [districtOptions, setDistrictOptions] = useState<string[]>([])

  useEffect(() => {
    if (!supplierId) return
    const current = getSupplier(supplierId)
    if (!current) {
      navigate('/fornecedores', { replace: true })
      return
    }
    setDraft({
      type: current.type,
      document: current.document,
      companyName: current.companyName,
      companyFantasy: current.companyFantasy,
      ie: current.ie,
      im: current.im,
      gender: current.gender,
      firstName: current.firstName,
      lastName: current.lastName,
      niceName: current.niceName,
      birthDate: current.birthDate,
      facebook: current.facebook,
      instagram: current.instagram,
      email: current.email,
      phones: current.phones.length ? current.phones : [emptyPhone()],
      cep: current.cep,
      street: current.street,
      number: current.number,
      extra: current.extra,
      state: current.state,
      city: current.city,
      district: current.district,
      transferType: current.transferType,
      accounts: current.accounts.length ? current.accounts : [emptyAccount()],
      pixKeys: current.pixKeys.length ? current.pixKeys : [emptyPix()],
    })
    if (current.district) setDistrictOptions([current.district])
    setReady(true)
  }, [supplierId, navigate])

  const isCompany = draft.document.trim().length > 14
  const cityOptions = withCurrent(citiesFor(draft.state), draft.city)
  const neighborhoodOptions = withCurrent(
    [...new Set([...neighborhoodsFor(draft.city), ...districtOptions])],
    draft.district,
  )

  useEffect(() => {
    const digits = onlyDigits(draft.cep)
    if (digits.length !== 8) {
      setCepStatus('idle')
      return
    }

    const controller = new AbortController()
    setCepStatus('loading')
    const timer = window.setTimeout(async () => {
      try {
        const { main, bairros } = await fetchAddressByCep(digits, controller.signal)
        if (!main) {
          setCepStatus('error')
          return
        }
        const state = resolveStateName(main)
        const city = main.localidade ?? ''
        const district = main.bairro?.trim() || bairros[0] || ''
        setDraft((current) => ({
          ...current,
          street: main.logradouro ?? '',
          extra: main.complemento ?? current.extra,
          state,
          city,
          district,
        }))
        setDistrictOptions(bairros)
        setCepStatus('idle')
        setErrors((current) => ({
          ...current,
          street: undefined,
          state: undefined,
          city: undefined,
          district: undefined,
        }))
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        setCepStatus('error')
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [draft.cep])

  const patch = (partial: Partial<SupplierInput>) => setDraft((current) => ({ ...current, ...partial }))

  const validate = (value: SupplierInput): Errors => {
    const next: Errors = {}
    if (!value.type) next.type = '"Type" não pode ficar em branco.'
    const document = value.document.trim()
    if (document && !isValidCpfCnpj(document)) next.document = 'Esse documento não é válido'
    const company = document.length > 14
    if (company && !value.companyName.trim()) {
      next.companyName = '"Company Name" não pode ficar em branco.'
    }
    if (!company && !value.firstName.trim()) next.firstName = '"Nome" não pode ficar em branco.'
    if (!value.phones[0]?.number.trim()) next.phone = '"Telefone" não pode ficar em branco.'
    if (!value.street.trim()) next.street = '"Logradouro" não pode ficar em branco.'
    if (!value.number.trim()) next.number = '"Número" não pode ficar em branco.'
    if (!value.state) next.state = '"Estado" não pode ficar em branco.'
    if (!value.city) next.city = '"Cidade" não pode ficar em branco.'
    if (!value.district) next.district = '"Bairro" não pode ficar em branco.'
    return next
  }

  const goBack = () => navigate('/fornecedores')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    const next = validate(draft)
    setErrors(next)
    if (Object.values(next).some(Boolean)) {
      const order = ['type', 'document', 'companyName', 'firstName', 'phone', 'street', 'number', 'state', 'city', 'district'] as const
      const first = order.find((key) => next[key])
      if (first) document.getElementById(`supplier-${first}`)?.focus()
      return
    }
    setSaving(true)
    window.setTimeout(() => {
      if (supplierId) updateSupplier(supplierId, draft)
      else addSupplier(draft)
      sessionStorage.setItem(
        TOAST_KEY,
        supplierId ? 'Fornecedor atualizado com sucesso.' : 'Fornecedor cadastrado com sucesso.',
      )
      navigate('/fornecedores')
    }, 400)
  }

  const actions = (footer = false) => (
    <div className="supplier-form__actions">
      <button type="button" className="supplier-form__back" onClick={goBack}>
        Voltar
      </button>
      <button type="submit" className="supplier-form__save" disabled={saving} form={footer ? 'supplier-form' : undefined}>
        {saving ? <Loader2 size={16} strokeWidth={2.25} className="supplier-form__spin" /> : <Check size={16} strokeWidth={2.5} />}
        {saving ? 'Salvando...' : editing ? 'Atualizar' : 'Cadastrar'}
      </button>
    </div>
  )

  if (!ready) return null

  const control = (invalid?: string) => `supplier-form__control${invalid ? ' is-invalid' : ''}`

  return (
    <div className="supplier-form">
      <form id="supplier-form" className="supplier-form__card" onSubmit={handleSubmit}>
        <header className="supplier-form__header">
          <h2>{editing ? 'Informações do fornecedor' : 'Informações do novo fornecedor'}</h2>
          {actions()}
        </header>

        <div className="supplier-form__body">
          <div className="supplier-form__sheet">
            <section>
              <h3>Informações básicas:</h3>
              <Field label="Categoria" htmlFor="supplier-type" required error={errors.type}>
                <select
                  id="supplier-type"
                  className={`${control(errors.type)} supplier-form__control--type`}
                  value={draft.type}
                  onChange={(event) => patch({ type: event.target.value as SupplierType })}
                >
                  <option value="">Selecione</option>
                  <option value="Consignado">Consignado</option>
                  <option value="Empresas">Empresas</option>
                </select>
              </Field>
              <Field label="CPF ou CNPJ" htmlFor="supplier-document" required error={errors.document}>
                <input
                  id="supplier-document"
                  className={control(errors.document)}
                  inputMode="numeric"
                  autoComplete="off"
                  value={draft.document}
                  onChange={(event) => {
                    patch({ document: maskCpfCnpj(event.target.value) })
                    if (errors.document) setErrors((current) => ({ ...current, document: undefined }))
                  }}
                />
              </Field>
            </section>

            {isCompany ? (
              <section>
                <h3>Identificação da empresa:</h3>
                <Field label="Company Name" htmlFor="supplier-companyName" required error={errors.companyName}>
                  <input
                    id="supplier-companyName"
                    className={control(errors.companyName)}
                    value={draft.companyName}
                    onChange={(event) => patch({ companyName: event.target.value })}
                  />
                </Field>
                <Field label="Company Fantasy" htmlFor="supplier-companyFantasy">
                  <input
                    id="supplier-companyFantasy"
                    className="supplier-form__control"
                    value={draft.companyFantasy}
                    onChange={(event) => patch({ companyFantasy: event.target.value })}
                  />
                </Field>
                <Field label="Ie" htmlFor="supplier-ie">
                  <input
                    id="supplier-ie"
                    className="supplier-form__control"
                    value={draft.ie}
                    onChange={(event) => patch({ ie: event.target.value })}
                  />
                </Field>
                <Field label="Im" htmlFor="supplier-im">
                  <input
                    id="supplier-im"
                    className="supplier-form__control"
                    value={draft.im}
                    onChange={(event) => patch({ im: event.target.value })}
                  />
                </Field>
              </section>
            ) : null}

            <section>
              {isCompany ? <h3>Identificação da pessoa:</h3> : null}
              <Field label="Identificação de gênero">
                <div className="supplier-form__radios" role="radiogroup">
                  {(
                    [
                      ['f', 'Feminino'],
                      ['m', 'Masculino'],
                      ['o', 'Outros'],
                    ] as const
                  ).map(([value, label]) => (
                    <label key={value} className="supplier-form__radio">
                      <input
                        type="radio"
                        name="supplier-gender"
                        value={value}
                        checked={draft.gender === value}
                        onChange={() => patch({ gender: value as SupplierGender })}
                      />
                      <span aria-hidden="true" />
                      {label}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Nome" htmlFor="supplier-firstName" required={!isCompany} error={errors.firstName}>
                <input
                  id="supplier-firstName"
                  className={control(errors.firstName)}
                  value={draft.firstName}
                  onChange={(event) => patch({ firstName: event.target.value })}
                />
              </Field>
              <Field label="Sobrenomes" htmlFor="supplier-lastName">
                <input
                  id="supplier-lastName"
                  className="supplier-form__control"
                  value={draft.lastName}
                  onChange={(event) => patch({ lastName: event.target.value })}
                />
              </Field>
              <Field label="Como gostaria de ser chamado" htmlFor="supplier-niceName">
                <input
                  id="supplier-niceName"
                  className="supplier-form__control"
                  value={draft.niceName}
                  onChange={(event) => patch({ niceName: event.target.value })}
                />
              </Field>
              <Field label="Data de nascimento" htmlFor="supplier-birthDate">
                <input
                  id="supplier-birthDate"
                  className="supplier-form__control"
                  inputMode="numeric"
                  placeholder="dd/mm/aaaa"
                  value={draft.birthDate}
                  onChange={(event) => patch({ birthDate: maskBirthDate(event.target.value) })}
                />
              </Field>
              <Field label="Facebook" htmlFor="supplier-facebook">
                <div className="supplier-form__addon">
                  <span>facebook.com/</span>
                  <input
                    id="supplier-facebook"
                    value={draft.facebook}
                    onChange={(event) => patch({ facebook: event.target.value })}
                  />
                </div>
              </Field>
              <Field label="Instagram" htmlFor="supplier-instagram">
                <div className="supplier-form__addon">
                  <span>instagram.com/</span>
                  <input
                    id="supplier-instagram"
                    value={draft.instagram}
                    onChange={(event) => patch({ instagram: event.target.value })}
                  />
                </div>
              </Field>
            </section>

            <section>
              <h3>Informações de contato:</h3>
              <Field label="Email" htmlFor="supplier-email" required>
                <input
                  id="supplier-email"
                  type="email"
                  className="supplier-form__control"
                  value={draft.email}
                  onChange={(event) => patch({ email: event.target.value })}
                />
              </Field>
              {draft.phones.map((phone, index) => (
                <Field
                  key={index}
                  label={index === 0 ? 'Telefone' : ''}
                  htmlFor={index === 0 ? 'supplier-phone' : undefined}
                  required={index === 0}
                  error={index === 0 ? errors.phone : undefined}
                  start
                >
                  <div className="supplier-form__phone-line">
                    <input
                      id={index === 0 ? 'supplier-phone' : undefined}
                      className={control(index === 0 ? errors.phone : undefined)}
                      inputMode="numeric"
                      placeholder="(99) 99999-9999"
                      value={phone.number}
                      onChange={(event) => {
                        const phones = draft.phones.slice()
                        phones[index] = { ...phone, number: maskPhone(event.target.value) }
                        patch({ phones })
                      }}
                    />
                    {draft.phones.length > 1 ? (
                      <button
                        type="button"
                        className="supplier-form__trash"
                        aria-label="Remover telefone"
                        onClick={() =>
                          patch({
                            phones: draft.phones.filter((_, item) => item !== index),
                          })
                        }
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    ) : null}
                  </div>
                  <div className="supplier-form__checks">
                    <label className="supplier-form__check">
                      <input
                        type="checkbox"
                        checked={phone.principal}
                        onChange={(event) => {
                          const checked = event.target.checked
                          patch({
                            phones: draft.phones.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, principal: checked }
                                : checked
                                  ? { ...item, principal: false }
                                  : item,
                            ),
                          })
                        }}
                      />
                      <span className="supplier-form__check-ui" aria-hidden="true" />
                      Telefone principal
                    </label>
                    <label className="supplier-form__check">
                      <input
                        type="checkbox"
                        checked={phone.whatsapp}
                        onChange={(event) => {
                          const phones = draft.phones.slice()
                          phones[index] = { ...phone, whatsapp: event.target.checked }
                          patch({ phones })
                        }}
                      />
                      <span className="supplier-form__check-ui" aria-hidden="true" />
                      Tem WhatsApp
                    </label>
                  </div>
                  {index === draft.phones.length - 1 ? (
                    <button
                      type="button"
                      className="supplier-form__add"
                      onClick={() => patch({ phones: [...draft.phones, emptyPhone()] })}
                    >
                      <Plus size={14} strokeWidth={2.5} />
                      Adicionar outro telefone
                    </button>
                  ) : null}
                </Field>
              ))}
            </section>

            <section>
              <h3>Endereço:</h3>
              <Field label="CEP" htmlFor="supplier-cep">
                <input
                  id="supplier-cep"
                  className="supplier-form__control"
                  inputMode="numeric"
                  placeholder="99999-999"
                  value={draft.cep}
                  onChange={(event) => patch({ cep: maskCep(event.target.value) })}
                />
                {cepStatus === 'loading' ? <p className="supplier-form__hint">Consultando...</p> : null}
                {cepStatus === 'error' ? <p className="supplier-form__error">CEP não encontrado</p> : null}
              </Field>
              <Field label="Logradouro" htmlFor="supplier-street" required error={errors.street}>
                <input
                  id="supplier-street"
                  className={control(errors.street)}
                  value={draft.street}
                  onChange={(event) => patch({ street: event.target.value })}
                />
              </Field>
              <Field label="Número" htmlFor="supplier-number" required error={errors.number}>
                <input
                  id="supplier-number"
                  className={control(errors.number)}
                  value={draft.number}
                  onChange={(event) => patch({ number: event.target.value })}
                />
              </Field>
              <Field label="Complemento" htmlFor="supplier-extra">
                <input
                  id="supplier-extra"
                  className="supplier-form__control"
                  value={draft.extra}
                  onChange={(event) => patch({ extra: event.target.value })}
                />
              </Field>
              <Field label="Estado" htmlFor="supplier-state" required error={errors.state}>
                <select
                  id="supplier-state"
                  className={control(errors.state)}
                  value={draft.state}
                  onChange={(event) => patch({ state: event.target.value, city: '', district: '' })}
                >
                  <option value="">Selecione</option>
                  {BRAZIL_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cidade" htmlFor="supplier-city" required error={errors.city}>
                <select
                  id="supplier-city"
                  className={control(errors.city)}
                  value={draft.city}
                  onChange={(event) => patch({ city: event.target.value, district: '' })}
                >
                  <option value="">Selecione uma cidade</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Bairro" htmlFor="supplier-district" required error={errors.district}>
                <NeighborhoodSelect
                  id="supplier-district"
                  value={draft.district}
                  options={neighborhoodOptions}
                  city={draft.city}
                  invalid={Boolean(errors.district)}
                  onChange={(district) => patch({ district })}
                  onRegister={(name) => setDistrictOptions((current) => withCurrent(current, name))}
                />
              </Field>
            </section>

            <section>
              <h3>Informações bancárias:</h3>
              <Field label="Tipo de transferência">
                <div className="supplier-form__radios" role="radiogroup">
                  {(
                    [
                      ['pix', 'Pix'],
                      ['common', 'Transferência'],
                    ] as const
                  ).map(([value, label]) => (
                    <label key={value} className="supplier-form__radio">
                      <input
                        type="radio"
                        name="supplier-transfer"
                        value={value}
                        checked={draft.transferType === value}
                        onChange={() => patch({ transferType: value as SupplierTransfer })}
                      />
                      <span aria-hidden="true" />
                      {label}
                    </label>
                  ))}
                </div>
              </Field>

              {draft.transferType === 'common'
                ? draft.accounts.map((account, index) => (
                    <Field key={index} label="" start>
                      <div className="supplier-form__bank">
                        <select
                          aria-label="Banco"
                          className="supplier-form__control"
                          value={account.bank}
                          onChange={(event) => {
                            const accounts = draft.accounts.slice()
                            accounts[index] = { ...account, bank: event.target.value }
                            patch({ accounts })
                          }}
                        >
                          <option value="">Banco</option>
                          {BANKS.map((bank) => (
                            <option key={bank} value={bank}>
                              {bank}
                            </option>
                          ))}
                        </select>
                        <select
                          aria-label="Tipo de conta"
                          className="supplier-form__control"
                          value={account.accountType}
                          onChange={(event) => {
                            const accounts = draft.accounts.slice()
                            accounts[index] = { ...account, accountType: event.target.value }
                            patch({ accounts })
                          }}
                        >
                          <option value="">Tipo de conta</option>
                          {ACCOUNT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <input
                          className="supplier-form__control"
                          placeholder="Agência"
                          value={account.agency}
                          onChange={(event) => {
                            const accounts = draft.accounts.slice()
                            accounts[index] = { ...account, agency: event.target.value }
                            patch({ accounts })
                          }}
                        />
                        <input
                          className="supplier-form__control"
                          placeholder="Conta"
                          value={account.account}
                          onChange={(event) => {
                            const accounts = draft.accounts.slice()
                            accounts[index] = { ...account, account: event.target.value }
                            patch({ accounts })
                          }}
                        />
                        <input
                          className="supplier-form__control"
                          placeholder="Operação"
                          value={account.operation}
                          onChange={(event) => {
                            const accounts = draft.accounts.slice()
                            accounts[index] = { ...account, operation: event.target.value }
                            patch({ accounts })
                          }}
                        />
                        <button
                          type="button"
                          className="supplier-form__trash"
                          aria-label="Remover conta"
                          onClick={() =>
                            patch({ accounts: draft.accounts.filter((_, item) => item !== index) })
                          }
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                      {index === draft.accounts.length - 1 ? (
                        <button
                          type="button"
                          className="supplier-form__add"
                          onClick={() => patch({ accounts: [...draft.accounts, emptyAccount()] })}
                        >
                          <Plus size={14} strokeWidth={2.5} />
                          Adicionar outra conta
                        </button>
                      ) : null}
                    </Field>
                  ))
                : null}

              {draft.transferType === 'common' && draft.accounts.length === 0 ? (
                <Field label="">
                  <button
                    type="button"
                    className="supplier-form__add"
                    onClick={() => patch({ accounts: [emptyAccount()] })}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    Adicionar outra conta
                  </button>
                </Field>
              ) : null}

              {draft.transferType === 'pix'
                ? draft.pixKeys.map((pix, index) => (
                    <Field key={index} label="" start>
                      <div className="supplier-form__bank">
                        <select
                          aria-label="Tipo de chave Pix"
                          className="supplier-form__control"
                          value={pix.keyType}
                          onChange={(event) => {
                            const pixKeys = draft.pixKeys.slice()
                            pixKeys[index] = { ...pix, keyType: event.target.value }
                            patch({ pixKeys })
                          }}
                        >
                          <option value="">Selecione</option>
                          {PIX_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <input
                          className="supplier-form__control"
                          aria-label="Chave Pix"
                          value={pix.value}
                          onChange={(event) => {
                            const pixKeys = draft.pixKeys.slice()
                            pixKeys[index] = { ...pix, value: event.target.value }
                            patch({ pixKeys })
                          }}
                        />
                        <button
                          type="button"
                          className="supplier-form__trash"
                          aria-label="Remover Pix"
                          onClick={() => patch({ pixKeys: draft.pixKeys.filter((_, item) => item !== index) })}
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                      {index === draft.pixKeys.length - 1 ? (
                        <button
                          type="button"
                          className="supplier-form__add"
                          onClick={() => patch({ pixKeys: [...draft.pixKeys, emptyPix()] })}
                        >
                          <Plus size={14} strokeWidth={2.5} />
                          Adicionar outro Pix
                        </button>
                      ) : null}
                    </Field>
                  ))
                : null}

              {draft.transferType === 'pix' && draft.pixKeys.length === 0 ? (
                <Field label="">
                  <button type="button" className="supplier-form__add" onClick={() => patch({ pixKeys: [emptyPix()] })}>
                    <Plus size={14} strokeWidth={2.5} />
                    Adicionar outro Pix
                  </button>
                </Field>
              ) : null}
            </section>
          </div>
        </div>

        <footer className="supplier-form__footer">{actions(true)}</footer>
      </form>
    </div>
  )
}
