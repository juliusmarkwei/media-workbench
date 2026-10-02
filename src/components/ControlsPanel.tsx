import { FORMATS, type FormatId } from '../lib/formats'
import Select from './Select'

interface ControlsPanelProps {
  formatId: FormatId
  onFormatChange: (id: FormatId) => void
  bitrate: string
  onBitrateChange: (bitrate: string) => void
  verb: string
  onConvert: () => void
  isBusy: boolean
  progress: number
  statusMessage: string
}

export default function ControlsPanel({
  formatId,
  onFormatChange,
  bitrate,
  onBitrateChange,
  verb,
  onConvert,
  isBusy,
  progress,
  statusMessage,
}: ControlsPanelProps) {
  const format = FORMATS.find((f) => f.id === formatId)!

  const formatOptions = FORMATS.map((f) => ({ value: f.id, label: f.label }))
  const qualityOptions = format.qualities?.map((q) => ({
    value: q.value,
    label: q.label,
    hint: `${q.value}bps`,
    recommended: q.recommended,
  }))

  return (
    <div className="flex w-full flex-col gap-5 border border-zinc-200 p-6 dark:border-zinc-800">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Output format
          </label>
          <Select
            ariaLabel="Output format"
            value={formatId}
            onChange={(id) => onFormatChange(id as FormatId)}
            options={formatOptions}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Quality
          </label>
          {qualityOptions ? (
            <Select ariaLabel="Quality" value={bitrate} onChange={onBitrateChange} options={qualityOptions} />
          ) : (
            <div className="flex items-center border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
              Lossless — no quality setting
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onConvert}
        disabled={isBusy}
        className="tactile flex items-center justify-center gap-2 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-[#ff5a1f] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-[#ff5a1f] dark:hover:text-white"
      >
        {isBusy ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span>{statusMessage || 'Working…'}</span>
          </>
        ) : (
          <span>
            {verb} to {format.label}
          </span>
        )}
      </button>

      {isBusy && (
        <div className="h-1 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-[#ff5a1f] transition-all duration-150"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}
