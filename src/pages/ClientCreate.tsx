import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Plus,
  Trash2,
} from 'lucide-react'
import { NeighborhoodSelect } from '../components/clients/NeighborhoodSelect'
import { addClient, isCpfCnpjRegistered } from '../lib/clientsStore'
import {
  isValidCpfCnpj,
  maskCpfCnpj,
  onlyDigits,
} from '../lib/cpfCnpj'
import {
  BRAZIL_STATES,
  fetchAddressByCep,
  maskCep,
  resolveStateName,
} from '../lib/brazilAddress'
import './ClientCreate.css'

const MEASURE_OPTIONS = [
  'Busto',
  'Cintura',
  'Quadril',
  'Altura',
  'Ombro',
  'Manga',
  'Outra',
]

/** Celular (99) 99999-9999 — com 10 dígitos fica (99) 9999-9999 */
function maskPhone(value: string) {
  const digits = onlyDigits(value, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

function maskBirthDate(value: string) {
  return onlyDigits(value, 8)
    .replace(/^(\d{2})(\d)/, '$1/$2')
    .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')
}

type Phone = {
  number: string
  primary: boolean
  whatsapp: boolean
}

type Measure = {
  type: string
  value: string
}

type Gender = 'feminino' | 'masculino' | 'outros' | ''
type CepStatus = 'idle' | 'loading' | 'ok' | 'error'

export function ClientCreate() {
  const navigate = useNavigate()
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [cpfError, setCpfError] = useState('')
  const [nomeError, setNomeError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [cep, setCep] = useState('')
  const [cepStatus, setCepStatus] = useState<CepStatus>('idle')
  const [logradouro, setLogradouro] = useState('')
  const [complemento, setComplemento] = useState('')
  const [cidade, setCidade] = useState('')
  const [bairro, setBairro] = useState('')
  const [bairroOptions, setBairroOptions] = useState<string[]>([])
  const [gender, setGender] = useState<Gender>('')
  const [phones, setPhones] = useState<Phone[]>([
    { number: '', primary: true, whatsapp: true },
  ])
  const [measures, setMeasures] = useState<Measure[]>([
    { type: '', value: '' },
  ])
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [stateUf, setStateUf] = useState('')
  const [rg, setRg] = useState('')
  const [nome, setNome] = useState('')
  const [sobrenomes, setSobrenomes] = useState('')
  const [chamado, setChamado] = useState('')
  const [email, setEmail] = useState('')
  const [facebook, setFacebook] = useState('')
  const [instagram, setInstagram] = useState('')
  const [numero, setNumero] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const goBack = () => navigate('/clientes')

  const validateCpfField = (value = cpfCnpj, { requireFilled = false } = {}) => {
    const trimmed = value.trim()
    if (!trimmed) {
      if (requireFilled) {
        setCpfError('"CPF ou CNPJ" não pode ficar em branco.')
        return false
      }
      setCpfError('')
      return false
    }
    if (!isValidCpfCnpj(trimmed)) {
      const digits = onlyDigits(trimmed)
      setCpfError(
        digits.length === 14
          ? 'Informe um CNPJ válido.'
          : 'Informe um CPF válido.',
      )
      return false
    }
    if (isCpfCnpjRegistered(trimmed)) {
      setCpfError('Esse documento já está cadastrado')
      return false
    }
    setCpfError('')
    return true
  }

  const validateNomeField = (value = nome) => {
    if (!value.trim()) {
      setNomeError('"Nome" não pode ficar em branco.')
      return false
    }
    setNomeError('')
    return true
  }

  const validatePhoneField = (value = phones[0]?.number ?? '') => {
    if (!value.trim()) {
      setPhoneError('"Telefone" não pode ficar em branco.')
      return false
    }
    setPhoneError('')
    return true
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!gender) return

    const cpfOk = validateCpfField(cpfCnpj, { requireFilled: true })
    const nomeOk = validateNomeField(nome)
    const phoneOk = validatePhoneField(phones[0]?.number ?? '')

    if (!cpfOk) {
      document.getElementById('cpfCnpj')?.focus()
      return
    }
    if (!nomeOk) {
      document.getElementById('nome')?.focus()
      return
    }
    if (!phoneOk) {
      document.getElementById('phone-0')?.focus()
      return
    }

    const created = addClient({
      cpfCnpj,
      rg,
      gender,
      nome: nome.trim(),
      sobrenomes: sobrenomes.trim(),
      chamado: chamado.trim(),
      birthDate,
      email: email.trim(),
      phones: phones.filter((phone) => phone.number.trim()),
      facebook: facebook.trim(),
      instagram: instagram.trim(),
      cep,
      logradouro,
      numero: numero.trim(),
      complemento,
      estado: stateUf,
      cidade,
      bairro,
      notifyEmail,
      measures: measures.filter((m) => m.type || m.value),
      observacoes: observacoes.trim(),
    })

    if (!created) {
      setCpfError('Esse documento já está cadastrado')
      document.getElementById('cpfCnpj')?.focus()
      return
    }

    navigate('/clientes')
  }

  useEffect(() => {
    const digits = onlyDigits(cep)

    // ao trocar/apagar CEP, remove bairros do CEP anterior imediatamente
    if (digits.length !== 8) {
      setCepStatus('idle')
      setBairroOptions([])
      setBairro('')
      return
    }

    const controller = new AbortController()
    setCepStatus('loading')
    setBairroOptions([])
    setBairro('')

    const timer = window.setTimeout(async () => {
      try {
        const { main, bairros } = await fetchAddressByCep(
          digits,
          controller.signal,
        )
        if (!main) {
          setCepStatus('error')
          setBairroOptions([])
          setBairro('')
          return
        }

        setLogradouro(main.logradouro ?? '')
        setComplemento(main.complemento ?? '')
        setCidade(main.localidade ?? '')
        setStateUf(resolveStateName(main))
        setBairroOptions(bairros)
        setBairro(main.bairro?.trim() || bairros[0] || '')
        setCepStatus('ok')
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        setCepStatus('error')
        setBairroOptions([])
        setBairro('')
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [cep])

  const ActionButtons = () => (
    <div className="client-create__actions">
      <button type="button" className="client-create__btn-back" onClick={goBack}>
        <ArrowLeft size={16} strokeWidth={2.25} />
        Voltar
      </button>
      <button type="submit" className="client-create__btn-save">
        <Check size={16} strokeWidth={2.5} />
        Cadastrar
      </button>
    </div>
  )

  return (
    <div className="client-create">
      <form className="client-create__card" onSubmit={handleSubmit}>
        <header className="client-create__card-header">
          <h2 className="client-create__card-title">Informações do novo cliente</h2>
          <ActionButtons />
        </header>

        <div className="client-create__body">
          <h3 className="client-create__section-title">Informações básicas:</h3>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="cpfCnpj">
              CPF ou CNPJ <span className="req">*</span>
            </label>
            <div className="client-create__field">
              <div className={`client-create__input-wrap${cpfError ? ' is-invalid' : ''}`}>
                <input
                  id="cpfCnpj"
                  className={`client-create__input${cpfError ? ' is-invalid' : ''}`}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00"
                  value={cpfCnpj}
                  onChange={(event) => {
                    const next = maskCpfCnpj(event.target.value)
                    setCpfCnpj(next)
                    const digits = onlyDigits(next)
                    if (digits.length === 11 || digits.length === 14) {
                      validateCpfField(next)
                    } else if (cpfError) {
                      setCpfError('')
                    }
                  }}
                  onBlur={(event) => {
                    validateCpfField(event.currentTarget.value, { requireFilled: true })
                  }}
                  aria-invalid={Boolean(cpfError)}
                  aria-describedby={cpfError ? 'cpfCnpj-error' : undefined}
                />
                {cpfError ? (
                  <CircleAlert
                    className="client-create__input-error-icon"
                    size={18}
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              {cpfError ? (
                <p id="cpfCnpj-error" className="client-create__field-error">
                  {cpfError}
                </p>
              ) : null}
            </div>
          </div>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="rg">
              RG
            </label>
            <input
              id="rg"
              className="client-create__input"
              value={rg}
              onChange={(event) => setRg(event.target.value)}
            />
          </div>

          <div className="client-create__row">
            <span className="client-create__label">
              Identificação de gênero <span className="req">*</span>
            </span>
            <div className="client-create__radios" role="radiogroup">
              {(
                [
                  ['feminino', 'Feminino'],
                  ['masculino', 'Masculino'],
                  ['outros', 'Outros'],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="client-create__radio">
                  <input
                    type="radio"
                    name="gender"
                    checked={gender === value}
                    onChange={() => setGender(value)}
                    required={gender === ''}
                  />
                  <span className="client-create__radio-ui" aria-hidden="true" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="nome">
              Nome <span className="req">*</span>
            </label>
            <div className="client-create__field">
              <div className={`client-create__input-wrap${nomeError ? ' is-invalid' : ''}`}>
                <input
                  id="nome"
                  className={`client-create__input${nomeError ? ' is-invalid' : ''}`}
                  value={nome}
                  onChange={(event) => {
                    setNome(event.target.value)
                    if (nomeError) setNomeError('')
                  }}
                  onBlur={(event) => {
                    validateNomeField(event.currentTarget.value)
                  }}
                  aria-invalid={Boolean(nomeError)}
                  aria-describedby={nomeError ? 'nome-error' : undefined}
                />
                {nomeError ? (
                  <CircleAlert
                    className="client-create__input-error-icon"
                    size={18}
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              {nomeError ? (
                <p id="nome-error" className="client-create__field-error">
                  {nomeError}
                </p>
              ) : null}
            </div>
          </div>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="sobrenomes">
              Sobrenomes
            </label>
            <input
              id="sobrenomes"
              className="client-create__input"
              value={sobrenomes}
              onChange={(event) => setSobrenomes(event.target.value)}
            />
          </div>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="chamado">
              Como quer ser chamado
            </label>
            <input
              id="chamado"
              className="client-create__input"
              value={chamado}
              onChange={(event) => setChamado(event.target.value)}
            />
          </div>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="nascimento">
              Data de nascimento
            </label>
            <input
              id="nascimento"
              className="client-create__input"
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              value={birthDate}
              onChange={(event) => setBirthDate(maskBirthDate(event.target.value))}
            />
          </div>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="client-create__input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          {phones.map((phone, index) => (
            <div key={index} className="client-create__row client-create__row--top">
              <label className="client-create__label" htmlFor={`phone-${index}`}>
                Telefone {index === 0 && <span className="req">*</span>}
              </label>
              <div className="client-create__phone-block">
                <div className="client-create__field">
                  <div
                    className={`client-create__input-wrap${
                      index === 0 && phoneError ? ' is-invalid' : ''
                    }`}
                  >
                    <input
                      id={`phone-${index}`}
                      className={`client-create__input${
                        index === 0 && phoneError ? ' is-invalid' : ''
                      }`}
                      inputMode="numeric"
                      placeholder="(99) 99999-9999"
                      value={phone.number}
                      onChange={(event) => {
                        const next = [...phones]
                        next[index] = {
                          ...phone,
                          number: maskPhone(event.target.value),
                        }
                        setPhones(next)
                        if (index === 0 && phoneError) setPhoneError('')
                      }}
                      onBlur={(event) => {
                        if (index !== 0) return
                        validatePhoneField(event.currentTarget.value)
                      }}
                      aria-invalid={index === 0 && Boolean(phoneError)}
                      aria-describedby={
                        index === 0 && phoneError ? 'phone-error' : undefined
                      }
                    />
                    {index === 0 && phoneError ? (
                      <CircleAlert
                        className="client-create__input-error-icon"
                        size={18}
                        strokeWidth={2.25}
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                  {index === 0 && phoneError ? (
                    <p id="phone-error" className="client-create__field-error">
                      {phoneError}
                    </p>
                  ) : null}
                </div>
                <div className="client-create__checks">
                  <label className="client-create__check">
                    <input
                      type="checkbox"
                      checked={phone.primary}
                      onChange={(event) => {
                        const checked = event.target.checked
                        setPhones((current) =>
                          current.map((item, i) =>
                            i === index
                              ? { ...item, primary: checked }
                              : checked
                                ? { ...item, primary: false }
                                : item,
                          ),
                        )
                      }}
                    />
                    <span className="client-create__check-ui" aria-hidden="true" />
                    <span>Telefone principal</span>
                  </label>
                  <label className="client-create__check">
                    <input
                      type="checkbox"
                      checked={phone.whatsapp}
                      onChange={(event) => {
                        const next = [...phones]
                        next[index] = { ...phone, whatsapp: event.target.checked }
                        setPhones(next)
                      }}
                    />
                    <span className="client-create__check-ui" aria-hidden="true" />
                    <span>Tem WhatsApp</span>
                  </label>
                </div>
                {index === phones.length - 1 && (
                  <button
                    type="button"
                    className="client-create__add-soft"
                    onClick={() =>
                      setPhones((current) => [
                        ...current,
                        { number: '', primary: false, whatsapp: false },
                      ])
                    }
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    Adicionar outro telefone
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="facebook">
              Facebook
            </label>
            <div className="client-create__affix">
              <span className="client-create__affix-prefix">facebook.com/</span>
              <input
                id="facebook"
                className="client-create__affix-input"
                value={facebook}
                onChange={(event) => setFacebook(event.target.value)}
              />
            </div>
          </div>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="instagram">
              Instagram
            </label>
            <div className="client-create__affix">
              <span className="client-create__affix-prefix">instagram.com/</span>
              <input
                id="instagram"
                className="client-create__affix-input"
                value={instagram}
                onChange={(event) => setInstagram(event.target.value)}
              />
            </div>
          </div>

          <h3 className="client-create__section-title">Endereço:</h3>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="cep">
              CEP
            </label>
            <div className="client-create__field">
              <input
                id="cep"
                className="client-create__input"
                inputMode="numeric"
                placeholder="99999-999"
                value={cep}
                onChange={(event) => setCep(maskCep(event.target.value))}
                aria-describedby="cep-status"
              />
              <p
                id="cep-status"
                className={`client-create__cep-status${
                  cepStatus === 'error' ? ' is-error' : ''
                }${cepStatus === 'ok' ? ' is-ok' : ''}`}
              >
                {cepStatus === 'loading' && 'Buscando endereço...'}
                {cepStatus === 'error' && 'CEP não encontrado'}
                {cepStatus === 'ok' && 'Endereço preenchido'}
              </p>
            </div>
          </div>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="logradouro">
              Logradouro <span className="req">*</span>
            </label>
            <input
              id="logradouro"
              className="client-create__input"
              required
              value={logradouro}
              onChange={(event) => setLogradouro(event.target.value)}
            />
          </div>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="numero">
              Número <span className="req">*</span>
            </label>
            <input
              id="numero"
              className="client-create__input"
              required
              value={numero}
              onChange={(event) => setNumero(event.target.value)}
            />
          </div>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="complemento">
              Complemento
            </label>
            <input
              id="complemento"
              className="client-create__input"
              value={complemento}
              onChange={(event) => setComplemento(event.target.value)}
            />
          </div>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="estado">
              Estado <span className="req">*</span>
            </label>
            <select
              id="estado"
              className="client-create__select"
              required
              value={stateUf}
              onChange={(event) => {
                setStateUf(event.target.value)
                setCidade('')
                setBairro('')
                setBairroOptions([])
              }}
            >
              <option value="">Selecione um estado</option>
              {BRAZIL_STATES.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="cidade">
              Cidade <span className="req">*</span>
            </label>
            <select
              id="cidade"
              className="client-create__select"
              required
              value={cidade}
              onChange={(event) => {
                setCidade(event.target.value)
                setBairro('')
              }}
            >
              <option value="">Selecione uma cidade</option>
              {cidade ? <option value={cidade}>{cidade}</option> : null}
            </select>
          </div>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="bairro">
              Bairro <span className="req">*</span>
            </label>
            <NeighborhoodSelect
              id="bairro"
              value={bairro}
              options={bairroOptions}
              city={cidade}
              required
              onChange={setBairro}
              onRegister={(name) => {
                setBairroOptions((current) => {
                  const key = name.toLocaleLowerCase('pt-BR')
                  if (current.some((item) => item.toLocaleLowerCase('pt-BR') === key)) {
                    return current
                  }
                  return [...current, name]
                })
              }}
            />
          </div>

          <h3 className="client-create__section-title">Notificações:</h3>

          <div className="client-create__row client-create__row--center">
            <span className="client-create__label">Email</span>
            <button
              type="button"
              className={`client-create__switch${notifyEmail ? ' is-on' : ''}`}
              aria-pressed={notifyEmail}
              onClick={() => setNotifyEmail((v) => !v)}
            >
              <span className="client-create__switch-knob">
                {notifyEmail ? <Check size={10} strokeWidth={3} /> : null}
              </span>
            </button>
          </div>

          <h3 className="client-create__section-title">Informações extras:</h3>

          <div className="client-create__row client-create__row--top">
            <span className="client-create__label">Medidas do cliente</span>
            <div className="client-create__measures">
              {measures.map((measure, index) => (
                <div key={index} className="client-create__measure-row">
                  <select
                    className="client-create__select"
                    value={measure.type}
                    onChange={(event) => {
                      const next = [...measures]
                      next[index] = { ...measure, type: event.target.value }
                      setMeasures(next)
                    }}
                  >
                    <option value="">Qual medida</option>
                    {MEASURE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <input
                    className="client-create__input client-create__input--sm"
                    value={measure.value}
                    onChange={(event) => {
                      const next = [...measures]
                      next[index] = { ...measure, value: event.target.value }
                      setMeasures(next)
                    }}
                  />
                  <button
                    type="button"
                    className="client-create__trash"
                    aria-label="Remover medida"
                    onClick={() =>
                      setMeasures((current) =>
                        current.length === 1
                          ? [{ type: '', value: '' }]
                          : current.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="client-create__add-soft"
                onClick={() =>
                  setMeasures((current) => [...current, { type: '', value: '' }])
                }
              >
                <Plus size={14} strokeWidth={2.5} />
                Adicionar outra medida
              </button>
            </div>
          </div>

          <div className="client-create__row client-create__row--top">
            <label className="client-create__label" htmlFor="obs">
              Observações
            </label>
            <textarea
              id="obs"
              className="client-create__textarea"
              rows={5}
              value={observacoes}
              onChange={(event) => setObservacoes(event.target.value)}
            />
          </div>
        </div>

        <footer className="client-create__card-footer">
          <ActionButtons />
        </footer>
      </form>
    </div>
  )
}
