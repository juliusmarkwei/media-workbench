import { createReadStream } from 'node:fs'
import cors from 'cors'
import express, { type Request, type Response } from 'express'
import {
  AUDIO_FORMAT_IDS,
  downloadAudio,
  downloadVideo,
  downloadVideoOnly,
  getInfo,
  type DownloadResult,
} from './ytdlp.js'

const PORT = Number(process.env.PORT ?? 8787)
const app = express()
app.use(cors({ origin: process.env.CORS_ORIGIN ?? true }))

function parseUrl(raw: unknown): string {
  if (typeof raw !== 'string' || raw.length === 0) throw new HttpError(400, 'missing url')
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new HttpError(400, 'invalid url')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new HttpError(400, 'url must be http(s)')
  }
  return raw
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

app.get('/api/info', async (req: Request, res: Response) => {
  try {
    const url = parseUrl(req.query.url)
    res.json(await getInfo(url))
  } catch (err) {
    sendError(res, err)
  }
})

app.get('/api/download', async (req: Request, res: Response) => {
  let result: DownloadResult | undefined
  try {
    const url = parseUrl(req.query.url)
    const type = req.query.type

    if (type === 'video' || type === 'videoonly') {
      const height = Number(req.query.height)
      if (!Number.isInteger(height) || height <= 0) throw new HttpError(400, 'invalid height')
      result = await (type === 'video' ? downloadVideo(url, height) : downloadVideoOnly(url, height))
    } else if (type === 'audio') {
      const format = String(req.query.format ?? '')
      if (!AUDIO_FORMAT_IDS.includes(format)) throw new HttpError(400, 'invalid audio format')
      const quality = req.query.quality ? String(req.query.quality) : undefined
      if (quality && !/^\d{1,4}[kK]$/.test(quality)) throw new HttpError(400, 'invalid quality')
      result = await downloadAudio(url, format, quality)
    } else {
      throw new HttpError(400, 'type must be "video", "videoonly" or "audio"')
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.name)}"`)
    const stream = createReadStream(result.file)
    const done = result.cleanup
    stream.on('close', () => void done())
    stream.on('error', () => void done())
    stream.pipe(res)
  } catch (err) {
    await result?.cleanup()
    sendError(res, err)
  }
})

function sendError(res: Response, err: unknown) {
  if (res.headersSent) return
  const status = err instanceof HttpError ? err.status : 500
  const message = err instanceof Error ? err.message : 'unknown error'
  res.status(status).json({ error: message })
}

app.listen(PORT, () => {
  console.log(`yt-dl microservice listening on http://localhost:${PORT}`)
})
