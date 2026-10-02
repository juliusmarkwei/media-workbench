export type FormatId = 'mp3' | 'wav' | 'm4a' | 'ogg' | 'opus' | 'flac'

export interface QualityTier {
  /** the actual ffmpeg -b:a value, and the Select's option value */
  value: string
  label: string
  recommended?: boolean
}

export interface AudioFormat {
  id: FormatId
  label: string
  ext: string
  mime: string
  codecArgs: string[]
  qualities?: QualityTier[]
}

export const FORMATS: AudioFormat[] = [
  {
    id: 'mp3',
    label: 'MP3',
    ext: 'mp3',
    mime: 'audio/mpeg',
    codecArgs: ['-c:a', 'libmp3lame'],
    qualities: [
      { value: '128k', label: 'Low' },
      { value: '192k', label: 'Standard', recommended: true },
      { value: '256k', label: 'High' },
      { value: '320k', label: 'Best' },
    ],
  },
  {
    id: 'm4a',
    label: 'M4A (AAC)',
    ext: 'm4a',
    mime: 'audio/mp4',
    codecArgs: ['-c:a', 'aac'],
    qualities: [
      { value: '96k', label: 'Low' },
      { value: '160k', label: 'Standard', recommended: true },
      { value: '224k', label: 'High' },
      { value: '320k', label: 'Best' },
    ],
  },
  {
    id: 'wav',
    label: 'WAV',
    ext: 'wav',
    mime: 'audio/wav',
    codecArgs: ['-c:a', 'pcm_s16le'],
  },
  {
    id: 'ogg',
    label: 'OGG (Vorbis)',
    ext: 'ogg',
    mime: 'audio/ogg',
    codecArgs: ['-c:a', 'libvorbis'],
    qualities: [
      { value: '128k', label: 'Low' },
      { value: '192k', label: 'Standard', recommended: true },
      { value: '256k', label: 'High' },
      { value: '320k', label: 'Best' },
    ],
  },
  {
    id: 'opus',
    label: 'Opus',
    ext: 'opus',
    mime: 'audio/opus',
    codecArgs: ['-c:a', 'libopus'],
    qualities: [
      { value: '48k', label: 'Low' },
      { value: '96k', label: 'Standard', recommended: true },
      { value: '128k', label: 'High' },
      { value: '192k', label: 'Best' },
    ],
  },
  {
    id: 'flac',
    label: 'FLAC',
    ext: 'flac',
    mime: 'audio/flac',
    codecArgs: ['-c:a', 'flac'],
  },
]

export const ACCEPTED_AUDIO_EXTENSIONS = [
  'mp3',
  'wav',
  'm4a',
  'aac',
  'ogg',
  'opus',
  'flac',
  'wma',
  'weba',
  'aiff',
  'aif',
  'amr',
]

export const ACCEPTED_VIDEO_EXTENSIONS = [
  'mp4',
  'm4v',
  'mov',
  'webm',
  'mkv',
  'avi',
  'wmv',
  'flv',
  '3gp',
]

export const ACCEPTED_INPUT_EXTENSIONS = [...ACCEPTED_AUDIO_EXTENSIONS, ...ACCEPTED_VIDEO_EXTENSIONS]

export function extOf(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0
  const m = Math.floor(seconds / 60)
  const s = seconds - m * 60
  return `${m}:${s.toFixed(1).padStart(4, '0')}`
}
