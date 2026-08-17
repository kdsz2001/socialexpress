import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Plus,
  Trash2,
} from 'lucide-react'
import { NeighborhoodSelect } from '../components/clients/NeighborhoodSelect'
import './ClientCreate.css'

const BRAZIL_STATES = [
  'Acre',
  'Alagoas',
  'Amapá',
  'Amazonas',
  'Bahia',
  'Ceará',
  'Distrito Federal',
  'Espírito Santo',
  'Goiás',
  'Maranhão',
  'Mato Grosso',
  'Mato Grosso do Sul',
  'Minas Gerais',
  'Pará',
  'Paraíba',
  'Paraná',
  'Pernambuco',
  'Piauí',
  'Rio de Janeiro',
  'Rio Grande do Norte',
  'Rio Grande do Sul',
  'Rondônia',
  'Roraima',
  'Santa Catarina',
  'São Paulo',
  'Sergipe',
  'Tocantins',
] as const

const UF_TO_STATE: Record<string, (typeof BRAZIL_STATES)[number]> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
}

const MEASURE_OPTIONS = [
  'Busto',
  'Cintura',
  'Quadril',
  'Altura',
  'Ombro',
  'Manga',
  'Outra',
]

function onlyDigits(value: string, max?: number) {
  const digits = value.replace(/\D/g, '')
  return max ? digits.slice(0, max) : digits
}

/** CPF 000.000.000-00 ou CNPJ 00.000.000/0000-00 conforme a quantidade digitada */
function maskCpfCnpj(value: string) {
  const digits = onlyDigits(value, 14)

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

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

function maskCep(value: string) {
  return onlyDigits(value, 8).replace(/^(\d{5})(\d{1,3})$/, '$1-$2')
}

function maskBirthDate(value: string) {
  return onlyDigits(value, 8)
    .replace(/^(\d{2})(\d)/, '$1/$2')
    .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')
}

type ViaCepResponse = {
  erro?: boolean | string
  logradouro?: string
  complemento?: string
  bairro?: string
  localidade?: string
  uf?: string
  estado?: string
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

  const goBack = () => navigate('/clientes')

  useEffect(() => {
    const digits = onlyDigits(cep)
    if (digits.length !== 8) {
      setCepStatus('idle')
      return
    }

    const controller = new AbortController()
    setCepStatus('loading')

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${digits}/json/`,
          { signal: controller.signal },
        )
        if (!response.ok) throw new Error('CEP lookup failed')
        const data = (await response.json()) as ViaCepResponse
        if (data.erro) {
          setCepStatus('error')
          return
        }

        setLogradouro(data.logradouro ?? '')
        if (data.complemento) setComplemento(data.complemento)
        const nextBairro = data.bairro ?? ''
        setBairro(nextBairro)
        setCidade(data.localidade ?? '')
        if (nextBairro) {
          setBairroOptions((current) => {
            const key = nextBairro.toLocaleLowerCase('pt-BR')
            if (current.some((item) => item.toLocaleLowerCase('pt-BR') === key)) {
              return current
            }
            return [...current, nextBairro]
          })
        }
        const stateName =
          data.estado ||
          (data.uf ? UF_TO_STATE[data.uf.toUpperCase()] : undefined) ||
          ''
        setStateUf(stateName)
        setCepStatus('ok')
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        setCepStatus('error')
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
      <form
        className="client-create__card"
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
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
            <input
              id="cpfCnpj"
              className="client-create__input"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              value={cpfCnpj}
              onChange={(event) => setCpfCnpj(maskCpfCnpj(event.target.value))}
              required
            />
          </div>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="rg">
              RG
            </label>
            <input id="rg" className="client-create__input" />
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
            <input id="nome" className="client-create__input" required />
          </div>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="sobrenomes">
              Sobrenomes
            </label>
            <input id="sobrenomes" className="client-create__input" />
          </div>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="chamado">
              Como quer ser chamado
            </label>
            <input id="chamado" className="client-create__input" />
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
            <input id="email" type="email" className="client-create__input" />
          </div>

          {phones.map((phone, index) => (
            <div key={index} className="client-create__row client-create__row--top">
              <label className="client-create__label" htmlFor={`phone-${index}`}>
                Telefone {index === 0 && <span className="req">*</span>}
              </label>
              <div className="client-create__phone-block">
                <input
                  id={`phone-${index}`}
                  className="client-create__input"
                  inputMode="numeric"
                  placeholder="(99) 99999-9999"
                  value={phone.number}
                  required={index === 0}
                  onChange={(event) => {
                    const next = [...phones]
                    next[index] = {
                      ...phone,
                      number: maskPhone(event.target.value),
                    }
                    setPhones(next)
                  }}
                />
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
              <input id="facebook" className="client-create__affix-input" />
            </div>
          </div>

          <div className="client-create__row">
            <label className="client-create__label" htmlFor="instagram">
              Instagram
            </label>
            <div className="client-create__affix">
              <span className="client-create__affix-prefix">instagram.com/</span>
              <input id="instagram" className="client-create__affix-input" />
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
            <input id="numero" className="client-create__input" required />
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
            <textarea id="obs" className="client-create__textarea" rows={5} />
          </div>
        </div>

        <footer className="client-create__card-footer">
          <ActionButtons />
        </footer>
      </form>
    </div>
  )
}
