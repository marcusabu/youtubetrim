# YouTube Trimmer App

A simple full-stack app to trim YouTube videos.  
It allows users to input a YouTube link and a start/end time, downloads the video using [`yt-dlp`](https://github.com/yt-dlp/yt-dlp), and trims it using [`ffmpeg`](https://ffmpeg.org/).

---

## ✨ Features

- 🧠 **Single-trim session** at a time – avoids overlapping processes
- 💾 **Local download** – videos are stored temporarily and overwritten with each new trim
- ⚡ **Vite-based client** with a clean UI
- 🧩 **Express server** for handling API logic
- 🔌 **tRPC** integration for end-to-end typesafety
- 🐳 **Docker Compose** support
- 🔐 Simple protected access via environment variables

---

## 🚀 Getting Started

### 🔧 Prerequisites

Make sure you have the following installed **locally** and available in your system path:

- [`yt-dlp`](https://github.com/yt-dlp/yt-dlp)
- [`ffmpeg`](https://ffmpeg.org/)

You can test installation with:

```bash
yt-dlp --version
ffmpeg -version
```

### 🧪 Development

1. Copy the environment file:

```bash
cp .env.example .env
```

2. Install dependencies and run the app:

```bash
yarn
yarn dev
```

### 🚢 Production

1. Copy the environment file:

```bash
cp .env.example .env
```

2. Build and start the app:

```bash
yarn build:client
yarn start:prod
```

### 🐳 Docker Compose

1. Copy the environment file:

```bash
cp .env.example .env.production
```

2. Run the app with Docker Compose:

```bash
docker-compose up --build
```

> ℹ️ Docker uses `.env.production` — not `.env` — so make sure you copy the template accordingly.

---

## 🔐 Environment Variables

| Variable         | Description                      |
| ---------------- | -------------------------------- |
| `SECRET_KEY`     | Used for internal auth/session   |
| `LOGIN_PASSWORD` | Password required to use the app |

---

## ⚠️ Limitations

- Only **one trim operation** can run at a time
- Each new trim **overwrites the previously trimmed video**
- Videos are **stored locally** in a `downloads/` folder
- This is intended for **personal use** or internal tools

---

## 📄 License

MIT — feel free to use, modify, or extend for your own projects.
