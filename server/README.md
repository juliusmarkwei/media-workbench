# YouTube download microservice

A standalone service for the Media Workbench frontend. It wraps
[`yt-dlp`](https://github.com/yt-dlp/yt-dlp) (bundled via `youtube-dl-exec`) to
list a video's available qualities and stream back either the merged
video+audio or audio extracted to a chosen format.

> **Usage note:** downloading content you don't own or that isn't licensed for
> download may violate YouTube's Terms of Service and copyright law. You are
> responsible for lawful use.

## Prerequisites

- Node 20+
- **`ffmpeg` on the host** — required to merge separate video/audio streams and
  to transcode audio. (`yt-dlp` itself is installed automatically with the deps.)

```bash
# macOS
brew install ffmpeg
```

## Run

```bash
cd server
pnpm install
pnpm dev        # http://localhost:8787, auto-reload
# or: pnpm start
```

Env vars: `PORT` (default `8787`), `CORS_ORIGIN` (default: allow all).

## API

- `GET /api/info?url=<video-url>` → `{ title, duration, thumbnail, uploader, webpageUrl, videoFormats }`,
  where each `videoFormats` entry is `{ height, size, videoOnlySize }` (sizes in bytes, estimated)
- `GET /api/download?url=<video-url>&type=video&height=<px>` → merged mp4 stream (video + audio)
- `GET /api/download?url=<video-url>&type=videoonly&height=<px>` → video-only stream, no audio
- `GET /api/download?url=<video-url>&type=audio&format=<mp3|m4a|wav|ogg|opus|flac>&quality=<e.g. 192k>` → audio stream

`quality` is ignored for lossless formats (wav, flac).
