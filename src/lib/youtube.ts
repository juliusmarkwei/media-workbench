const API_BASE = import.meta.env.VITE_YT_API_BASE ?? 'http://localhost:8787'

export interface VideoFormat {
  height: number
  size: number | null
  videoOnlySize: number | null
}

export interface VideoInfo {
  title: string
  duration: number | null
  thumbnail: string | null
  uploader: string | null
  webpageUrl: string
  videoFormats: VideoFormat[]
}

export async function fetchInfo(url: string): Promise<VideoInfo> {
  const res = await fetch(`${API_BASE}/api/info?url=${encodeURIComponent(url)}`)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Request failed (${res.status})`)
  }
  return res.json()
}

export function videoDownloadUrl(url: string, height: number, audio = true): string {
  const type = audio ? 'video' : 'videoonly'
  return `${API_BASE}/api/download?type=${type}&url=${encodeURIComponent(url)}&height=${height}`
}

export function audioDownloadUrl(url: string, format: string, quality?: string): string {
  const q = quality ? `&quality=${encodeURIComponent(quality)}` : ''
  return `${API_BASE}/api/download?type=audio&url=${encodeURIComponent(url)}&format=${format}${q}`
}

export function heightLabel(height: number): string {
  const name =
    height >= 4320 ? '8K' : height >= 2160 ? '4K' : height >= 1440 ? '2K' : null
  return name ? `${height}p (${name})` : `${height}p`
}

export function formatBytes(bytes: number | null): string | undefined {
  if (bytes === null || !Number.isFinite(bytes)) return undefined
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/** rough size estimate for re-encoded audio output, in bytes */
export function estimateAudioBytes(
  formatId: string,
  bitrate: string,
  duration: number | null,
): number | null {
  if (!duration) return null
  if (formatId === 'wav') return Math.round(44100 * 2 * 2 * duration)
  if (formatId === 'flac') return Math.round(44100 * 2 * 2 * duration * 0.6)
  const kbps = parseInt(bitrate, 10)
  if (!kbps) return null
  return Math.round((kbps * 1000) / 8 * duration)
}
