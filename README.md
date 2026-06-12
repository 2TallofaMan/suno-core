# Suno Core - Personal AI Music Generator

A **single-user, personal AI music generation tool** inspired by Suno.com. No accounts, no paywalls, just a powerful tool for creating music with AI assistance.

## Features

### Core
- ✅ Text-to-music generation (via Replicate API)
- ✅ Simple prompt interface with genre, mood, BPM, key controls
- ✅ Local file storage for projects and tracks
- ✅ Audio playback with volume control

### AI-Powered
- ✅ Mistral-powered prompt optimization (included with Vibe Pro)
- ✅ Creative AI chat assistant
- ✅ Lyrics generation
- ✅ Mixing advice
- ✅ Reference track analysis with similarity control (25-100%)

### Editing
- ✅ Basic track management
- ✅ Stem separation (vocals, drums, bass, other)
- ✅ Project organization

### Planned
- Vocal generation (text-to-singing)
- Advanced editing (trim, split, rearrange)
- MIDI export
- Batch processing
- Preset management

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **State Management**: Zustand with persistence
- **Audio Processing**: Howler.js, wavesurfer.js
- **AI Models**:
  - Mistral API (chat, prompt optimization, analysis) - included with Vibe Pro
  - Replicate API (music generation, vocals, stem separation)

## Quick Start

### Prerequisites
- Node.js 20+
- Git
- Mistral Vibe Pro subscription (for Mistral API)
- Replicate account (for music generation)

### Install & Run

```bash
# Navigate to your project
cd suno-core/frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

```
NEXT_PUBLIC_MISTRAL_API_KEY=your_mistral_api_key
NEXT_PUBLIC_REPLICATE_API_KEY=your_replicate_api_key
```

## Usage

### Generation
1. Enter a prompt (e.g., "A chill lofi beat with piano")
2. Adjust parameters (style, mood, BPM, key)
3. Click "Generate Music"
4. Wait for Replicate to generate (~15-20s)
5. Audio plays automatically

### Reference Track
1. Click "Upload Reference"
2. Select an audio file
3. Set similarity slider (25%=creative, 100%=exact match)
4. Click "Apply to Generation"
5. The prompt is enhanced based on the reference

### Chat Assistant
Ask for:
- Lyrics suggestions
- Chord progressions
- Song structure ideas
- Mixing advice
- Prompt refinement

## Cost Analysis

| Component | Cost | Notes |
|-----------|------|-------|
| Mistral API | $0.00 | Included with Vibe Pro |
| Replicate MusicGen | ~$0.02/30s | Per generation |
| Replicate RVC | ~$0.05 | Per vocal generation |
| Replicate Demucs | ~$0.05 | Per stem separation |
| **Total per track** | **~$0.30** | With 4 variations + vocals + stems |

## Notes

- **Personal use only** - No multi-user features
- **Hybrid approach** - Mistral API (included) + Replicate (paid)
- **Local storage** - Projects saved in browser's localStorage
- **GitHub** - Code is on your GitHub: https://github.com/2TallofaMan/suno-core

---

**Built with Mistral Vibe** 🚀
