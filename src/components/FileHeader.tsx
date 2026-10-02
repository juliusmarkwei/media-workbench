interface FileHeaderProps {
  name: string
  onNameChange: (name: string) => void
  ext: string
  sizeMB: number
  onClear: () => void
}

export default function FileHeader({ name, onNameChange, ext, sizeMB, onClear }: FileHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 border border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline">
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            spellCheck={false}
            aria-label="Output file name"
            style={{ width: `${Math.max(name.length, 1) + 1}ch` }}
            className="max-w-full min-w-0 shrink border border-transparent bg-transparent px-1 -mx-1 text-sm font-medium outline-none hover:border-zinc-200 focus:border-[#ff5a1f] dark:hover:border-zinc-700"
          />
          <span className="shrink-0 font-mono text-sm font-medium text-zinc-400 dark:text-zinc-500">.{ext}</span>
        </div>
        <p className="px-1 font-mono text-xs text-zinc-400 dark:text-zinc-500">{sizeMB.toFixed(2)} MB</p>
      </div>
      <button
        onClick={onClear}
        className="shrink-0 px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
      >
        Change file
      </button>
    </div>
  )
}
