'use client'

/** max source file size we bother reading (8MB) */
const MAX_INPUT = 8 * 1024 * 1024

/**
 * Resize a picked photo to a 128x128 JPEG data URL (~5-20KB) for upload.
 * Square-crops from the center. Throws an Arabic message on bad input.
 */
export async function fileToAvatar(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('الملف ده مش صورة')
  if (file.size > MAX_INPUT) throw new Error('الصورة كبيرة أوي - جرّب صورة أصغر من 8 ميجا')
  const bmp = await createImageBitmap(file).catch(() => null)
  if (!bmp) throw new Error('مقدرناش نقرا الصورة دي')
  const side = Math.min(bmp.width, bmp.height)
  const sx = Math.floor((bmp.width - side) / 2)
  const sy = Math.floor((bmp.height - side) / 2)
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('المتصفح مش قادر يجهز الصورة')
  ctx.drawImage(bmp, sx, sy, side, side, 0, 0, 128, 128)
  bmp.close()
  return canvas.toDataURL('image/jpeg', 0.85)
}
