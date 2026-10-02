import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import youtubeDl from 'youtube-dl-exec'

export interface VideoFormat {
  height: number
  /** estimated total download size in bytes (video + audio), or null if unknown */
  size: number | null
  /** estimated size in bytes of the video stream alone, or null if unknown */
  videoOnlySize: number | null
}

export interface VideoInfo {
  title: string
  duration: number | null
  thumbnail: string | null
  uploader: string | null
  webpageUrl: string
  /** video qualities available, descending by height */
  videoFormats: VideoFormat[]
}

interface RawFormat {
  height?: number | null
  vcodec?: string | null
  acodec?: string | null
  filesize?: number | null
  filesize_approx?: number | null
  tbr?: number | null
}

function formatSize(f: RawFormat, duration: number | null): number | null {
  if (typeof f.filesize === 'number') return f.filesize
  if (typeof f.filesize_approx === 'number') return f.filesize_approx
  if (typeof f.tbr === 'number' && duration) return Math.round((f.tbr * 1000) / 8 * duration)
  return null
}

const baseFlags = {
  noWarnings: true,
  noPlaylist: true,
  noCheckCertificates: true,
  ...(process.env.PROXY ? { proxy: process.env.PROXY } : {}),
}

export async function getInfo(url: string): Promise<VideoInfo> {
  const info = (await youtubeDl(url, { ...baseFlags, dumpSingleJson: true })) as unknown as {
    title?: string
    duration?: number
    thumbnail?: string
    uploader?: string
    webpage_url?: string
    formats?: RawFormat[]
  }

  const formats = info.formats ?? []
  const duration = info.duration ?? null

  let audioSize: number | null = null
  let bestAudioTbr = -1
  for (const f of formats) {
    if (f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none')) {
      const tbr = f.tbr ?? 0
      if (tbr > bestAudioTbr) {
        bestAudioTbr = tbr
        audioSize = formatSize(f, duration)
      }
    }
  }

  // best video stream per height (matches yt-dlp's bestvideo selection by bitrate)
  const best = new Map<number, { tbr: number; vSize: number | null; progressive: boolean }>()
  for (const f of formats) {
    if (!(f.vcodec && f.vcodec !== 'none' && typeof f.height === 'number' && f.height > 0)) continue
    const tbr = f.tbr ?? 0
    const current = best.get(f.height)
    if (!current || tbr > current.tbr) {
      best.set(f.height, {
        tbr,
        vSize: formatSize(f, duration),
        progressive: Boolean(f.acodec && f.acodec !== 'none'),
      })
    }
  }

  const videoFormats: VideoFormat[] = [...best.entries()]
    .map(([height, v]) => ({
      height,
      videoOnlySize: v.vSize,
      size:
        v.progressive || v.vSize === null || audioSize === null ? v.vSize : v.vSize + audioSize,
    }))
    .sort((a, b) => b.height - a.height)

  return {
    title: info.title ?? 'video',
    duration,
    thumbnail: info.thumbnail ?? null,
    uploader: info.uploader ?? null,
    webpageUrl: info.webpage_url ?? url,
    videoFormats,
  }
}

export interface DownloadResult {
  /** absolute path to the produced media file */
  file: string
  /** suggested download filename */
  name: string
  /** call after the file has been streamed to remove the temp directory */
  cleanup: () => Promise<void>
}

async function run(url: string, flags: Record<string, unknown>): Promise<DownloadResult> {
  const dir = await mkdtemp(join(tmpdir(), 'yt-'))
  try {
    await youtubeDl(url, {
      ...baseFlags,
      ...flags,
      restrictFilenames: true,
      output: join(dir, '%(title)s.%(ext)s'),
    })
    const files = (await readdir(dir)).filter((f) => !f.endsWith('.part'))
    if (files.length === 0) throw new Error('yt-dlp produced no output file')
    return {
      file: join(dir, files[0]),
      name: files[0],
      cleanup: () => rm(dir, { recursive: true, force: true }),
    }
  } catch (err) {
    await rm(dir, { recursive: true, force: true })
    throw err
  }
}

export function downloadVideo(url: string, height: number): Promise<DownloadResult> {
  return run(url, {
    format: `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`,
    mergeOutputFormat: 'mp4',
  })
}

export function downloadVideoOnly(url: string, height: number): Promise<DownloadResult> {
  return run(url, {
    format: `bestvideo[height<=${height}]/best[height<=${height}]`,
  })
}

/** yt-dlp --audio-format value per our format id */
const AUDIO_FORMAT: Record<string, string> = {
  mp3: 'mp3',
  m4a: 'm4a',
  wav: 'wav',
  flac: 'flac',
  opus: 'opus',
  ogg: 'vorbis',
}

export const AUDIO_FORMAT_IDS = Object.keys(AUDIO_FORMAT)

export function downloadAudio(url: string, format: string, quality?: string): Promise<DownloadResult> {
  const audioFormat = AUDIO_FORMAT[format]
  if (!audioFormat) throw new Error(`unsupported audio format: ${format}`)
  return run(url, {
    extractAudio: true,
    audioFormat,
    ...(quality ? { audioQuality: quality } : {}),
  })
}
