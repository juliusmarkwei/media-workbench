import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin, { type Region } from 'wavesurfer.js/plugins/regions'

const SKELETON_BAR_HEIGHTS = [
  18, 28, 40, 55, 48, 32, 44, 60, 72, 58, 38, 26, 42, 62, 78, 90, 82, 64, 46, 34, 50, 68, 56, 40, 30, 46, 62, 38, 24,
  36, 28, 18,
]

interface WaveformProps {
  file: File
  onReady: (duration: number) => void
  onRegionChange?: (start: number, end: number) => void
  onError: () => void
  isPlaying: boolean
  onPlaybackEnd: () => void
  withRegion?: boolean
}

export default function Waveform({
  file,
  onReady,
  onRegionChange,
  onError,
  isPlaying,
  onPlaybackEnd,
  withRegion = true,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const regionsRef = useRef<RegionsPlugin | null>(null)
  const regionRef = useRef<Region | null>(null)
  const [isDecoding, setIsDecoding] = useState(true)

  useEffect(() => {
    setIsDecoding(true)
    if (!containerRef.current) return

    const regions = RegionsPlugin.create()
    regionsRef.current = regions

    const isDark = document.documentElement.classList.contains('dark')

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: isDark ? '#4a4a48' : '#d4d1c9',
      progressColor: '#ff5a1f',
      cursorColor: isDark ? '#f2f1ee' : '#18181b',
      barWidth: 2,
      barGap: 1,
      barRadius: 0,
      height: 96,
      normalize: true,
      url: URL.createObjectURL(file),
      plugins: [regions],
    })
    wavesurferRef.current = ws

    ws.on('ready', (duration) => {
      if (withRegion) {
        const region = regions.addRegion({
          start: 0,
          end: duration,
          color: 'rgba(255, 90, 31, 0.15)',
          drag: true,
          resize: true,
        })
        regionRef.current = region
        onRegionChange?.(0, duration)
      }
      setIsDecoding(false)
      onReady(duration)
    })

    regions.on('region-updated', (region) => {
      onRegionChange?.(region.start, region.end)
    })

    ws.on('finish', () => {
      onPlaybackEnd()
    })

    ws.on('error', () => {
      setIsDecoding(false)
      onError()
    })

    ws.on('timeupdate', (time) => {
      const region = regionRef.current
      if (region && ws.isPlaying() && time >= region.end) {
        ws.pause()
        onPlaybackEnd()
      }
    })

    return () => {
      ws.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  useEffect(() => {
    const ws = wavesurferRef.current
    if (!ws) return
    if (isPlaying && !ws.isPlaying()) {
      const region = regionRef.current
      if (region) {
        if (ws.getCurrentTime() < region.start || ws.getCurrentTime() >= region.end) {
          ws.setTime(region.start)
        }
      }
      void ws.play()
    } else if (!isPlaying && ws.isPlaying()) {
      ws.pause()
    }
  }, [isPlaying])

  return (
    <div className="relative w-full border border-zinc-200 p-4 dark:border-zinc-800">
      <div ref={containerRef} className="w-full" />
      {isDecoding && (
        <div className="absolute inset-4 flex flex-col items-center justify-center gap-3 bg-[#f6f4ef] dark:bg-[#111110]">
          <div className="flex h-24 items-end gap-1">
            {SKELETON_BAR_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className="skeleton-bar w-1 rounded-none bg-zinc-300 dark:bg-zinc-700"
                style={{ height: `${h}%`, animationDelay: `${i * 35}ms` }}
              />
            ))}
          </div>
          <p className="font-mono text-xs text-zinc-400 dark:text-zinc-500">decoding audio…</p>
        </div>
      )}
    </div>
  )
}
