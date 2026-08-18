/** Tamanho do quadrado salvo — cobre telas retina no avatar do topbar (~36–40px). */
const AVATAR_OUTPUT_SIZE = 320
const AVATAR_JPEG_QUALITY = 0.92

/**
 * Recorta o centro em quadrado e redimensiona com boa qualidade,
 * gerando um JPEG data URL nítido para o avatar.
 */
export function prepareAvatarDataUrl(sourceDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      try {
        const size = Math.min(image.naturalWidth, image.naturalHeight)
        if (size <= 0) {
          reject(new Error('Imagem inválida'))
          return
        }

        const sx = Math.floor((image.naturalWidth - size) / 2)
        const sy = Math.floor((image.naturalHeight - size) / 2)

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
          size,
          size,
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
