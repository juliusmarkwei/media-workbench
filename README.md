# Media Workbench

A fast, private media toolkit: convert audio, extract audio from video, trim clips, and download from YouTube. File processing runs entirely in the browser — no uploads, no backend — and MP3, M4A, WAV, OGG, Opus, and FLAC are all supported.

## Features

- **YouTube downloads** — paste a link to grab the video+audio in any available quality (merged to MP4), or extract audio-only to any supported format. Requires the companion microservice in [`server/`](./server).
- Convert audio or video files (video's audio track is extracted automatically)
- Output formats: MP3, M4A (AAC), WAV, OGG (Vorbis), Opus, and FLAC
- Trim audio by dragging a region on the waveform
- Named quality tiers (Low / Standard / High / Best) tuned per codec
- Rename the output file before downloading
- Drop a file anywhere in the window, not just onto the dropzone
- Light/dark theme, remembered between visits
- Conversion happens locally via [ffmpeg.wasm](https://ffmpegwasm.netlify.app/)

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- [wavesurfer.js](https://wavesurfer.xyz/) for waveform display and trim regions
- [Radix UI](https://www.radix-ui.com/) for accessible custom dropdowns
- `@ffmpeg/ffmpeg` (ffmpeg.wasm) for in-browser media transcoding

## Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

## YouTube downloads

File conversion runs entirely in the browser. YouTube downloading can't — it
needs a server to run `yt-dlp` and `ffmpeg` — so it lives in a separate
microservice under [`server/`](./server). Start it alongside the frontend:

```bash
cd server && pnpm install && pnpm dev   # http://localhost:8787
```

The frontend points at `http://localhost:8787` by default; override with the
`VITE_YT_API_BASE` env var. See [`server/README.md`](./server/README.md) for
prerequisites (notably `ffmpeg`) and the API.

> Downloading content you don't own or that isn't licensed for download may
> violate YouTube's Terms of Service and copyright. You are responsible for
> lawful use.
