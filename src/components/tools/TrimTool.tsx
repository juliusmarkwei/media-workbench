import { useCallback, useState } from 'react'
import { useFFmpeg } from '../../hooks/useFFmpeg'
import { useWindowFileDrop } from '../../hooks/useWindowFileDrop'
import { extOf, formatTime } from '../../lib/formats'
import DragOverlay from '../DragOverlay'
import Dropzone from '../Dropzone'
import FileHeader from '../FileHeader'
import PlayerBar from '../PlayerBar'
import Waveform from '../Waveform'

const ACCEPT = [
  'mp3', 'wav', 'm4a', 'aac', 'ogg', 'opus', 'flac', 'aiff', 'aif',
  'mp4', 'm4v', 'mov', 'webm', 'mkv', 'avi',
]

export default function TrimTool() {
  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [outputName, setOutputName] = useState('')
  const [previewError, setPreviewError] = useState(false)
  const [reject, setReject] = useState('')

  const { clip, isLoading, error } = useFFmpeg()
  const [isBusy, setIsBusy] = useState(false)

  const ext = file ? extOf(file.name) : ''
  const clipLength = Math.max(0, trimEnd - trimStart)

  const handleFile = useCallback((f: File | null) => {
    if (f && !ACCEPT.includes(extOf(f.name))) {
      setReject('Trim needs an audio or video file.')
      return
    }
    setReject('')
    setFile(f)
    setDuration(0)
    setTrimStart(0)
    setTrimEnd(0)
    setIsPlaying(false)
    setProgress(0)
    setStatusMessage('')
    setOutputName(f ? `${f.name.replace(/\.[^/.]+$/, '')}-clip` : '')
    setPreviewError(false)
  }, [])

  const isDraggingFile = useWindowFileDrop(handleFile)

  const handleTrim = useCallback(async () => {
    if (!file) return
    setIsBusy(true)
    setProgress(0)
    setStatusMessage('Loading engine…')
    try {
      const blob = await clip({
        file,
        trimStart,
        trimEnd,
        onProgress: (ratio) => {
          setProgress(ratio)
          setStatusMessage('Trimming…')
        },
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${outputName.trim() || `${file.name.replace(/\.[^/.]+$/, '')}-clip`}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setStatusMessage('Done!')
    } catch (e) {
      setStatusMessage(e instanceof Error ? e.message : 'Failed')
    } finally {
      setIsBusy(false)
      setTimeout(() => setStatusMessage(''), 2500)
    }
  }, [file, trimStart, trimEnd, outputName, ext, clip])

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {isDraggingFile && <DragOverlay />}

      {!file && (
        <Dropzone
          onFile={handleFile}
          accept={ACCEPT}
          mediaKinds={['audio/*', 'video/*']}
          hint="audio or video — drag the region to cut a clip"
        />
      )}
      {reject && <p className="text-center text-sm text-red-500">{reject}</p>}

      {file && (
        <>
          <FileHeader
            name={outputName}
            onNameChange={setOutputName}
            ext={ext}
            sizeMB={file.size / (1024 * 1024)}
            onClear={() => handleFile(null)}
          />

          {previewError ? (
            <div className="border border-zinc-200 px-4 py-5 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              Can&apos;t show a waveform for this file, so trimming isn&apos;t available here.
            </div>
          ) : (
            <>
              <Waveform
                file={file}
                onReady={(d) => {
                  setDuration(d)
                  setTrimEnd(d)
                }}
                onRegionChange={(start, end) => {
                  setTrimStart(start)
                  setTrimEnd(end)
                }}
                onError={() => setPreviewError(true)}
                isPlaying={isPlaying}
                onPlaybackEnd={() => setIsPlaying(false)}
              />
              <div className="border border-zinc-200 px-4 py-3.5 dark:border-zinc-800">
                <PlayerBar
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying((p) => !p)}
                  trimStart={trimStart}
                  trimEnd={trimEnd}
                  duration={duration}
                />
              </div>

              <div className="flex w-full flex-col gap-4 border border-zinc-200 p-6 dark:border-zinc-800">
                <div className="flex items-center justify-between font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Clip range</span>
                  <span className="text-zinc-700 dark:text-zinc-200">
                    {formatTime(trimStart)} – {formatTime(trimEnd)} ({formatTime(clipLength)})
                  </span>
                </div>
                <button
                  onClick={handleTrim}
                  disabled={isBusy || isLoading || clipLength < 0.1}
                  className="tactile flex items-center justify-center gap-2 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-[#ff5a1f] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-[#ff5a1f] dark:hover:text-white"
                >
                  {isBusy || isLoading ? statusMessage || 'Working…' : `Trim clip (.${ext})`}
                </button>
                {(isBusy || isLoading) && (
                  <div className="h-1 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <div className="h-full bg-[#ff5a1f] transition-all duration-150" style={{ width: `${Math.round(progress * 100)}%` }} />
                  </div>
                )}
              </div>
            </>
          )}

          {error && <p className="text-center text-sm text-red-500">{error}</p>}
        </>
      )}

      <p className="text-center font-mono text-xs text-zinc-400 dark:text-zinc-500">
        lossless cut · no re-encode · nothing leaves your browser
      </p>
    </div>
  )
}
