import { addProduct, listProducts } from './productsStore'

const DEMO = [
  { code: '010001', name: 'Blazer Azul Marinho', size: '48', color: 'Azul Marinho', price: '270,00' },
  { code: '010002', name: 'Calça Azul Marinho', size: '42', color: 'Azul Marinho', price: '180,00' },
  { code: '010003', name: 'Colete Azul Marinho', size: '48', color: 'Azul Marinho', price: '140,00' },
  { code: '020001', name: 'Blazer Preto Clássico', size: '50', color: 'Preto', price: '260,00' },
  { code: '020002', name: 'Calça Preta', size: '44', color: 'Preto', price: '170,00' },
  { code: '030001', name: 'Blazer Cinza', size: '46', color: 'Cinza', price: '250,00' },
] as const

/** Catálogo inicial de trajes para o pedido, só quando ainda não há produtos. */
export function seedDemoProducts() {
  if (listProducts().length > 0) return
  for (const item of DEMO) {
    addProduct({
      name: item.name,
      type: 'Traje',
      rental: `R$ ${item.price}`,
      fullCode: item.code,
      size: item.size,
      color: item.color,
      quantity: '1',
      status: 'ativo',
      attributes: `tamanho:${item.size}, cor:${item.color}`,
    })
  }
}
