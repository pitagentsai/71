import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const runtime = 'nodejs'
export const alt = 'setteuno.com'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  try {
    // Read the logo file from public directory
    const logoPath = join(process.cwd(), 'public', 'Rectangle (1).png')
    const logoBuffer = await readFile(logoPath)
    const logoBase64 = logoBuffer.toString('base64')
    const logoDataUrl = `data:image/png;base64,${logoBase64}`

    return new ImageResponse(
      (
        <div
          style={{
            background: '#000000',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '600px',
              height: '400px',
              backgroundImage: `url(${logoDataUrl})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }}
          />
        </div>
      ),
      {
        ...size,
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)
    // Fallback: return a simple black image with text
    return new ImageResponse(
      (
        <div
          style={{
            background: '#000000',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '64px',
            fontFamily: 'monospace',
          }}
        >
          setteuno.com
        </div>
      ),
      {
        ...size,
      }
    )
  }
}

