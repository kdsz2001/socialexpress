type CashMovementRequest = 'entrada' | 'saida'

type Listener = (type: CashMovementRequest) => void

const listeners = new Set<Listener>()

export function requestCashMovement(type: CashMovementRequest) {
  listeners.forEach((listener) => listener(type))
}

export function subscribeCashMovementRequest(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
