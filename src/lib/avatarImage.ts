/** Tamanho do quadrado salvo — cobre telas retina no avatar do topbar (~36–40px). */
export const AVATAR_OUTPUT_SIZE = 320
const AVATAR_JPEG_QUALITY = 0.92

export type AvatarCropArea = {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Recorta a área escolhida e redimensiona com boa qualidade,
 * gerando um JPEG data URL nítido para o avatar.
 */
export function cropAvatarToDataUrl(
  sourceDataUrl: string,
  area: AvatarCropArea,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      try {
        const sx = Math.max(0, Math.round(area.x))
        const sy = Math.max(0, Math.round(area.y))
        const sw = Math.max(1, Math.round(area.width))
        const sh = Math.max(1, Math.round(area.height))

        if (sx + sw > image.naturalWidth + 1 || sy + sh > image.naturalHeight + 1) {
          reject(new Error('Área de recorte inválida'))
          return
        }

        const canvas = document.createElement('canvas')
        canvas.width = AVATAR_OUTPUT_SIZE
        canvas.height = AVATAR_OUTPUT_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas indisponível'))
          return
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(
          image,
          sx,
          sy,
          sw,
          sh,
          0,
          0,
          AVATAR_OUTPUT_SIZE,
          AVATAR_OUTPUT_SIZE,
        )

        resolve(canvas.toDataURL('image/jpeg', AVATAR_JPEG_QUALITY))
      } catch (error) {
        reject(error)
      }
    }
    image.onerror = () => reject(new Error('Não foi possível carregar a imagem'))
    image.src = sourceDataUrl
  })
}

/** Recorte central (fallback). */
export function prepareAvatarDataUrl(sourceDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const size = Math.min(image.naturalWidth, image.naturalHeight)
      if (size <= 0) {
        reject(new Error('Imagem inválida'))
        return
      }
      const x = Math.floor((image.naturalWidth - size) / 2)
      const y = Math.floor((image.naturalHeight - size) / 2)
      cropAvatarToDataUrl(sourceDataUrl, { x, y, width: size, height: size }).then(
        resolve,
        reject,
      )
    }
    image.onerror = () => reject(new Error('Não foi possível carregar a imagem'))
    image.src = sourceDataUrl
  })
}
