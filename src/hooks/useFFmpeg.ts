import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { useCallback, useRef, useState } from 'react'
import type { AudioFormat } from '../lib/formats'

const CORE_BASE = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm'

let ffmpegSingleton: FFmpeg | null = null
let loadPromise: Promise<boolean> | null = null

async function getFFmpeg() {
  if (!ffmpegSingleton) {
    ffmpegSingleton = new FFmpeg()
  }
  const ffmpeg = ffmpegSingleton
  if (!ffmpeg.loaded && !loadPromise) {
    loadPromise = ffmpeg.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
    })
  }
  if (loadPromise) await loadPromise
  return ffmpeg
}

export interface TranscodeOptions {
  file: File
  format: AudioFormat
  bitrate?: string
  trimStart?: number
  trimEnd?: number
  onProgress?: (ratio: number) => void
}

export interface ClipOptions {
  file: File
  trimStart: number
  trimEnd: number
  onProgress?: (ratio: number) => void
}

function fileExt(name: string): string {
  return name.split('.').pop() || 'bin'
}

export function useFFmpeg() {
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(() => ffmpegSingleton?.loaded ?? false)
  const [error, setError] = useState<string | null>(null)
  const progressCb = useRef<((ratio: number) => void) | null>(null)

  const ensureLoaded = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    try {
      const ffmpeg = await getFFmpeg()
      setIsReady(true)
      return ffmpeg
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load converter engine')
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [])

  const transcode = useCallback(async (opts: TranscodeOptions): Promise<Blob> => {
    const { file, format, bitrate, trimStart, trimEnd, onProgress } = opts
    setError(null)
    const ffmpeg = await ensureLoaded()

    progressCb.current = onProgress ?? null
    const progressHandler = ({ progress }: { progress: number }) => {
      if (progressCb.current) progressCb.current(Math.min(Math.max(progress, 0), 1))
    }
    ffmpeg.on('progress', progressHandler)

    const inputName = `input_${Date.now()}.${fileExt(file.name)}`
    const outputName = `output_${Date.now()}.${format.ext}`

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file))

      const args: string[] = ['-i', inputName]
      if (typeof trimStart === 'number' && trimStart > 0) {
        args.push('-ss', trimStart.toFixed(3))
      }
      if (typeof trimEnd === 'number' && trimEnd > (trimStart ?? 0)) {
        const duration = trimEnd - (trimStart ?? 0)
        args.push('-t', duration.toFixed(3))
      }
      args.push(...format.codecArgs)
      if (bitrate && format.qualities) {
        args.push('-b:a', bitrate)
      }
      args.push('-vn', outputName)

      await ffmpeg.exec(args)
      const data = await ffmpeg.readFile(outputName)
      const bytes = data as Uint8Array
      return new Blob([bytes.slice()], { type: format.mime })
    } finally {
      ffmpeg.off('progress', progressHandler)
      try {
        await ffmpeg.deleteFile(inputName)
      } catch {
        /* ignore */
      }
      try {
        await ffmpeg.deleteFile(outputName)
      } catch {
        /* ignore */
      }
    }
  }, [ensureLoaded])

  const clip = useCallback(async (opts: ClipOptions): Promise<Blob> => {
    const { file, trimStart, trimEnd, onProgress } = opts
    setError(null)
    const ffmpeg = await ensureLoaded()

    progressCb.current = onProgress ?? null
    const progressHandler = ({ progress }: { progress: number }) => {
      if (progressCb.current) progressCb.current(Math.min(Math.max(progress, 0), 1))
    }
    ffmpeg.on('progress', progressHandler)

    const ext = fileExt(file.name)
    const inputName = `input_${Date.now()}.${ext}`
    const outputName = `output_${Date.now()}.${ext}`

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file))

      const args: string[] = []
      if (trimStart > 0) args.push('-ss', trimStart.toFixed(3))
      args.push('-i', inputName)
      if (trimEnd > trimStart) args.push('-t', (trimEnd - trimStart).toFixed(3))
      args.push('-c', 'copy', outputName)

      await ffmpeg.exec(args)
      const data = await ffmpeg.readFile(outputName)
      const bytes = data as Uint8Array
      return new Blob([bytes.slice()], { type: file.type || 'application/octet-stream' })
    } finally {
      ffmpeg.off('progress', progressHandler)
      try {
        await ffmpeg.deleteFile(inputName)
      } catch {
        /* ignore */
      }
      try {
        await ffmpeg.deleteFile(outputName)
      } catch {
        /* ignore */
      }
    }
  }, [ensureLoaded])

  return { transcode, clip, ensureLoaded, isLoading, isReady, error }
}
