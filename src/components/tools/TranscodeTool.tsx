import { useCallback, useMemo, useState } from 'react'
import { useFFmpeg } from '../../hooks/useFFmpeg'
import { useWindowFileDrop } from '../../hooks/useWindowFileDrop'
import { extOf, FORMATS, type FormatId } from '../../lib/formats'
import ControlsPanel from '../ControlsPanel'
import DragOverlay from '../DragOverlay'
import Dropzone from '../Dropzone'
import FileHeader from '../FileHeader'
import PlayerBar from '../PlayerBar'
import Waveform from '../Waveform'

interface TranscodeToolProps {
  accept: string[]
  mediaKinds: string[]
  hint: string
  verb: string
  rejectMessage: string
  note: string
}

export default function TranscodeTool({ accept, mediaKinds, hint, verb, rejectMessage, note }: TranscodeToolProps) {
  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [formatId, setFormatId] = useState<FormatId>('mp3')
  const [bitrate, setBitrate] = useState('192k')
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [outputName, setOutputName] = useState('')
  const [previewError, setPreviewError] = useState(false)
  const [reject, setReject] = useState('')

  const { transcode, isLoading, error } = useFFmpeg()
  const [isConverting, setIsConverting] = useState(false)

  const format = useMemo(() => FORMATS.find((f) => f.id === formatId)!, [formatId])

  const handleFile = useCallback(
    (f: File | null) => {
      if (f && !accept.includes(extOf(f.name))) {
        setReject(rejectMessage)
        return
      }
      setReject('')
      setFile(f)
      setDuration(0)
      setIsPlaying(false)
      setProgress(0)
      setStatusMessage('')
      setOutputName(f ? f.name.replace(/\.[^/.]+$/, '') : '')
      setPreviewError(false)
    },
    [accept, rejectMessage],
  )

  const isDraggingFile = useWindowFileDrop(handleFile)

  const handleFormatChange = useCallback((id: FormatId) => {
    setFormatId(id)
    const f = FORMATS.find((fmt) => fmt.id === id)!
    const recommended = f.qualities?.find((q) => q.recommended) ?? f.qualities?.[0]
    if (recommended) setBitrate(recommended.value)
  }, [])

  const handleRun = useCallback(async () => {
    if (!file) return
    setIsConverting(true)
    setProgress(0)
    setStatusMessage('Loading engine…')
    try {
      const blob = await transcode({
        file,
        format,
        bitrate: format.qualities ? bitrate : undefined,
        onProgress: (ratio) => {
          setProgress(ratio)
          setStatusMessage('Working…')
        },
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${outputName.trim() || file.name.replace(/\.[^/.]+$/, '')}.${format.ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setStatusMessage('Done!')
    } catch (e) {
      setStatusMessage(e instanceof Error ? e.message : 'Failed')
    } finally {
      setIsConverting(false)
      setTimeout(() => setStatusMessage(''), 2500)
    }
  }, [file, format, bitrate, outputName, transcode])

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {isDraggingFile && <DragOverlay />}

      {!file && <Dropzone onFile={handleFile} accept={accept} hint={hint} mediaKinds={mediaKinds} />}
      {reject && <p className="text-center text-sm text-red-500">{reject}</p>}

      {file && (
        <>
          <FileHeader
            name={outputName}
            onNameChange={setOutputName}
            ext={format.ext}
            sizeMB={file.size / (1024 * 1024)}
            onClear={() => handleFile(null)}
          />

          {previewError ? (
            <div className="border border-zinc-200 px-4 py-5 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              Can&apos;t preview this file in-browser, but you can still process the whole thing.
            </div>
          ) : (
            <>
              <Waveform
                file={file}
                withRegion={false}
                onReady={setDuration}
                onError={() => setPreviewError(true)}
                isPlaying={isPlaying}
                onPlaybackEnd={() => setIsPlaying(false)}
              />
              <div className="border border-zinc-200 px-4 py-3.5 dark:border-zinc-800">
                <PlayerBar
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying((p) => !p)}
                  trimStart={0}
                  trimEnd={duration}
                  duration={duration}
                />
              </div>
            </>
          )}

          <ControlsPanel
            formatId={formatId}
            onFormatChange={handleFormatChange}
            bitrate={bitrate}
            onBitrateChange={setBitrate}
            verb={verb}
            onConvert={handleRun}
            isBusy={isConverting || isLoading}
            progress={progress}
            statusMessage={statusMessage}
          />

          {error && <p className="text-center text-sm text-red-500">{error}</p>}
        </>
      )}

      <p className="text-center font-mono text-xs text-zinc-400 dark:text-zinc-500">{note}</p>
    </div>
  )
}
