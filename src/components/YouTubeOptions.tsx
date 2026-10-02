import { useMemo, useState } from 'react'
import { FORMATS, type FormatId } from '../lib/formats'
import {
  audioDownloadUrl,
  estimateAudioBytes,
  formatBytes,
  heightLabel,
  videoDownloadUrl,
  type VideoInfo,
} from '../lib/youtube'
import SegmentedTabs from './SegmentedTabs'
import Select from './Select'

interface YouTubeOptionsProps {
  url: string
  info: VideoInfo
}

type Mode = 'video' | 'videoonly' | 'audio'

function triggerDownload(href: string) {
  // A hidden iframe downloads attachments without navigating away; an error
  // response (JSON, no Content-Disposition) loads harmlessly inside it.
  const frame = document.createElement('iframe')
  frame.style.display = 'none'
  frame.src = href
  document.body.appendChild(frame)
  setTimeout(() => frame.remove(), 60000)
}

export default function YouTubeOptions({ url, info }: YouTubeOptionsProps) {
  const hasVideo = info.videoFormats.length > 0
  const [mode, setMode] = useState<Mode>(hasVideo ? 'video' : 'audio')
  const [height, setHeight] = useState(String(info.videoFormats[0]?.height ?? ''))
  const [formatId, setFormatId] = useState<FormatId>('mp3')
  const [bitrate, setBitrate] = useState('192k')
  const [preparing, setPreparing] = useState(false)

  const format = useMemo(() => FORMATS.find((f) => f.id === formatId)!, [formatId])
  const isVideo = mode === 'video' || mode === 'videoonly'
  const selectedFmt = info.videoFormats.find((f) => String(f.height) === height)

  const selectedSize =
    mode === 'video'
      ? (selectedFmt?.size ?? null)
      : mode === 'videoonly'
        ? (selectedFmt?.videoOnlySize ?? null)
        : estimateAudioBytes(formatId, bitrate, info.duration)

  const handleFormatChange = (id: string) => {
    setFormatId(id as FormatId)
    const f = FORMATS.find((fmt) => fmt.id === id)!
    const recommended = f.qualities?.find((q) => q.recommended) ?? f.qualities?.[0]
    if (recommended) setBitrate(recommended.value)
  }

  const handleDownload = () => {
    const href =
      mode === 'audio'
        ? audioDownloadUrl(url, formatId, format.qualities ? bitrate : undefined)
        : videoDownloadUrl(url, Number(height), mode === 'video')
    triggerDownload(href)
    setPreparing(true)
    setTimeout(() => setPreparing(false), 4000)
  }

  const videoOptions = info.videoFormats.map((f) => ({
    value: String(f.height),
    label: heightLabel(f.height),
    hint: formatBytes(mode === 'videoonly' ? f.videoOnlySize : f.size),
  }))

  return (
    <div className="flex w-full flex-col gap-5 border border-zinc-200 p-6 dark:border-zinc-800">
      <SegmentedTabs
        ariaLabel="Download type"
        value={mode}
        onChange={(v) => setMode(v as Mode)}
        options={[
          { value: 'video', label: 'Video + audio', disabled: !hasVideo },
          { value: 'videoonly', label: 'Video only', disabled: !hasVideo },
          { value: 'audio', label: 'Audio only' },
        ]}
      />

      {isVideo ? (
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Quality
          </label>
          {hasVideo ? (
            <Select ariaLabel="Video quality" value={height} onChange={setHeight} options={videoOptions} />
          ) : (
            <div className="flex items-center border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
              No video stream available
            </div>
          )}
          <p className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
            {mode === 'video' ? 'Merged to MP4 (H.264 + audio)' : 'Video stream only, no audio track'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Format
            </label>
            <Select
              ariaLabel="Audio format"
              value={formatId}
              onChange={handleFormatChange}
              options={FORMATS.map((f) => ({ value: f.id, label: f.label }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Quality
            </label>
            {format.qualities ? (
              <Select
                ariaLabel="Audio quality"
                value={bitrate}
                onChange={setBitrate}
                options={format.qualities.map((q) => ({
                  value: q.value,
                  label: q.label,
                  hint: `${q.value}bps`,
                  recommended: q.recommended,
                }))}
              />
            ) : (
              <div className="flex items-center border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                Lossless — no quality setting
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between font-mono text-xs text-zinc-500 dark:text-zinc-400">
        <span>Estimated size</span>
        <span className="text-zinc-700 dark:text-zinc-200">
          {selectedSize !== null ? `≈ ${formatBytes(selectedSize)}` : 'unknown'}
        </span>
      </div>

      <button
        onClick={handleDownload}
        disabled={isVideo && !hasVideo}
        className="tactile bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-[#ff5a1f] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-[#ff5a1f] dark:hover:text-white"
      >
        {preparing
          ? 'Preparing on server — download will start…'
          : mode === 'audio'
            ? `Download ${format.label} audio`
            : mode === 'videoonly'
              ? `Download ${height}p video (no audio)`
              : `Download ${height}p video`}
      </button>
    </div>
  )
}
