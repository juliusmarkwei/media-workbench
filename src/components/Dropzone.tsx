import { useCallback, useRef } from 'react'

interface DropzoneProps {
  onFile: (file: File) => void
  accept: string[]
  hint: string
  mediaKinds?: string[]
}

export default function Dropzone({ onFile, accept, hint, mediaKinds = [] }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 border border-dashed border-zinc-300 p-10 text-center transition-colors hover:border-zinc-400 hover:bg-zinc-900/[0.02] sm:p-16 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:bg-white/[0.02]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="h-6 w-6 text-zinc-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V4.5m0 0L7 9.5m5-5 5 5M4.5 19.5h15" />
      </svg>
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Drop a file, or click to browse</p>
      <p className="font-mono text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept.map((ext) => `.${ext}`).concat(mediaKinds).join(',')}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
