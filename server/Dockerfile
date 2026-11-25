FROM node:22-bookworm-slim

ARG BGUTIL_VERSION=2.0.2

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg python3 python3-venv python-is-python3 git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV VIRTUAL_ENV=/opt/yt-dlp
ENV PATH=$VIRTUAL_ENV/bin:$PATH
RUN python3 -m venv $VIRTUAL_ENV \
  && pip install --no-cache-dir -U "yt-dlp[default,curl-cffi]" "bgutil-ytdlp-pot-provider==${BGUTIL_VERSION}"

RUN git clone --depth 1 --single-branch --branch ${BGUTIL_VERSION} \
    https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git /opt/bgutil \
  && cd /opt/bgutil/server \
  && npm ci --no-audit --no-fund \
  && npx tsc \
  && npm prune --omit=dev

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV YOUTUBE_DL_SKIP_DOWNLOAD=1
ENV YOUTUBE_DL_DIR=$VIRTUAL_ENV/bin
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN chmod +x docker-entrypoint.sh

EXPOSE 8787
CMD ["./docker-entrypoint.sh"]
