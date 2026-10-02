import { useState } from 'react'
import { fetchInfo, type VideoInfo } from '../lib/youtube'
import { formatTime } from '../lib/formats'
import TiltCard from './TiltCard'
import YouTubeOptions from './YouTubeOptions'

export default function YouTubePanel() {
  const [url, setUrl] = useState('')
  const [info, setInfo] = useState<VideoInfo | null>(null)
  const [loadedUrl, setLoadedUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFetch = async () => {
    const trimmed = url.trim()
    if (!trimmed || loading) return
    setLoading(true)
    setError('')
    setInfo(null)
    try {
      const data = await fetchInfo(trimmed)
      setInfo(data)
      setLoadedUrl(trimmed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not fetch video')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleFetch()
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a YouTube link…"
          spellCheck={false}
          aria-label="YouTube URL"
          className="min-w-0 flex-1 border border-zinc-300 bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors hover:border-zinc-400 focus:border-[#ff5a1f] dark:border-zinc-700 dark:hover:border-zinc-500"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="tactile shrink-0 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ff5a1f] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-[#ff5a1f] dark:hover:text-white"
        >
          {loading ? 'Fetching…' : 'Fetch'}
        </button>
      </form>

      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      {info && (
        <>
          <TiltCard
            max={5}
            className="rise flex items-center gap-4 border border-zinc-200 bg-white/40 p-4 shadow-sm dark:border-zinc-800 dark:bg-white/[0.03]"
          >
            {info.thumbnail && (
              <img
                src={info.thumbnail}
                alt=""
                className="h-16 w-28 shrink-0 object-cover shadow-md"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" title={info.title}>
                {info.title}
              </p>
              <p className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                {info.uploader ? `${info.uploader} · ` : ''}
                {info.duration ? formatTime(info.duration) : ''}
              </p>
            </div>
          </TiltCard>

          <div className="rise">
            <YouTubeOptions url={loadedUrl} info={info} />
          </div>
        </>
      )}

      <p className="text-center font-mono text-xs text-zinc-400 dark:text-zinc-500">
        you're responsible for complying with YouTube's terms & copyright
      </p>
    </div>
  )
}
