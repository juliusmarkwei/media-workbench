import { useState } from 'react'
import SegmentedTabs from './components/SegmentedTabs'
import ThemeToggle from './components/ThemeToggle'
import YouTubePanel from './components/YouTubePanel'
import TranscodeTool from './components/tools/TranscodeTool'
import TrimTool from './components/tools/TrimTool'
import { useTheme } from './hooks/useTheme'
import { ACCEPTED_AUDIO_EXTENSIONS, ACCEPTED_VIDEO_EXTENSIONS } from './lib/formats'

const REPO_URL = 'https://github.com/juliusmarkwei/media-to-audio'

type Tool = 'convert' | 'extract' | 'trim' | 'youtube'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [tool, setTool] = useState<Tool>('convert')

  return (
    <>
      <div className="app-bg" aria-hidden />

      <div className="relative z-10 min-h-screen px-4 py-10 text-zinc-900 sm:py-16 dark:text-zinc-100">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
                media<span className="text-[#ff5a1f]">/</span>bench
              </h1>
              <p className="mt-1.5 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
                A focused toolkit — convert audio, extract audio from video, trim a clip, or
                download from YouTube.
              </p>
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>

          <div className="rise border border-zinc-200/80 bg-[#faf9f6]/75 p-4 shadow-[0_1px_0_rgba(0,0,0,0.03),0_24px_60px_-28px_rgba(0,0,0,0.3)] backdrop-blur-sm sm:p-6 dark:border-zinc-800/80 dark:bg-[#17171a]/70">
            <div className="mb-6 flex justify-center">
              <SegmentedTabs
                ariaLabel="Tool"
                size="sm"
                value={tool}
                onChange={(v) => setTool(v as Tool)}
                options={[
                  { value: 'convert', label: 'convert' },
                  { value: 'extract', label: 'extract' },
                  { value: 'trim', label: 'trim' },
                  { value: 'youtube', label: 'youtube' },
                ]}
              />
            </div>

            {tool === 'convert' && (
              <TranscodeTool
                key="convert"
                accept={ACCEPTED_AUDIO_EXTENSIONS}
                mediaKinds={['audio/*']}
                hint="mp3 · wav · m4a · ogg · opus · flac — change format or quality"
                verb="Convert"
                rejectMessage="Convert takes an audio file. For video, use the Extract tool."
                note="audio format conversion · nothing leaves your browser"
              />
            )}
            {tool === 'extract' && (
              <TranscodeTool
                key="extract"
                accept={ACCEPTED_VIDEO_EXTENSIONS}
                mediaKinds={['video/*']}
                hint="mp4 · mov · webm · mkv · avi — pull the audio track out"
                verb="Extract audio"
                rejectMessage="Extract takes a video file. For audio, use the Convert tool."
                note="video → audio track · nothing leaves your browser"
              />
            )}
            {tool === 'trim' && <TrimTool />}
            {tool === 'youtube' && <YouTubePanel />}
          </div>

          <footer className="mt-6 flex justify-center">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="tactile inline-flex items-center gap-2 font-mono text-xs text-zinc-400 hover:text-[#ff5a1f] dark:text-zinc-500"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.71.12 2.51.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
              </svg>
              View source on GitHub
            </a>
          </footer>
        </div>
      </div>
    </>
  )
}
