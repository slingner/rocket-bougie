import sharp from 'sharp'

async function detectOpening(templatePath: string) {
  const img = sharp(templatePath)
  const { width, height } = await img.metadata()
  if (!width || !height) throw new Error('Could not read image dimensions')

  const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  const alpha = (x: number, y: number) => data[(y * width + x) * 4 + 3]

  const cx = Math.floor(width / 2)
  const cy = Math.floor(height / 2)

  // Find inner opening: scan from edges toward center, find where alpha goes to 0
  let left = 0, right = width - 1, top = 0, bottom = height - 1

  for (let x = 0; x < cx; x++) {
    if (alpha(x, cy) === 0) { left = x; break }
  }
  for (let x = width - 1; x > cx; x--) {
    if (alpha(x, cy) === 0) { right = x; break }
  }
  for (let y = 0; y < cy; y++) {
    if (alpha(cx, y) === 0) { top = y; break }
  }
  for (let y = height - 1; y > cy; y--) {
    if (alpha(cx, y) === 0) { bottom = y; break }
  }

  const innerW = right - left + 1
  const innerH = bottom - top + 1

  console.log(`Frame: ${width}×${height}`)
  console.log(`Opening: left=${left} top=${top} right=${right} bottom=${bottom}`)
  console.log(`Opening size: ${innerW}×${innerH}`)
  console.log(`Aspect ratio: ${(innerW / innerH).toFixed(4)} (8×10 = ${(8/10).toFixed(4)})`)

  return { width, height, left, top, right, bottom, innerW, innerH }
}

detectOpening('/Users/scottlingner/Desktop/framed-template.png')
