import { LIMITS } from '../configs/app'

export interface ChartImage {
  dataUrl: string
  base64: string
  mimeType: 'image/jpeg'
}

/** Checks the file's first bytes, so a renamed file can't pass as an image. */
export async function sniffImageType(file: Blob): Promise<'image/png' | 'image/jpeg' | null> {
  const b = new Uint8Array(await file.slice(0, 4).arrayBuffer())
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  return null
}

/** Returns an error message, or null when the file is acceptable. */
export async function checkImageFile(file: File): Promise<string | null> {
  if (file.size > LIMITS.maxImageBytes) {
    return `The image is too large (max ${Math.round(LIMITS.maxImageBytes / 1024 / 1024)} MB).`
  }
  if (!(await sniffImageType(file))) return 'Please upload a JPG or PNG image.'
  return null
}

/** Resizes and re-encodes the chart in the browser before it is sent or saved. */
export async function compressImage(file: Blob): Promise<ChartImage> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, LIMITS.imageMaxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This browser cannot process images.')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
  return { dataUrl, base64: dataUrl.slice(dataUrl.indexOf(',') + 1), mimeType: 'image/jpeg' }
}

export function base64FromDataUrl(dataUrl: string): string {
  return dataUrl.slice(dataUrl.indexOf(',') + 1)
}
