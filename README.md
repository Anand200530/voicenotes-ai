# VoiceNotes AI - AI-Powered Voice Notes App

Turn your voice notes into actionable insights with AI-powered transcription, summarization, and action item extraction.

## Features

### 🎤 Voice Recording
- Simple one-tap voice recording
- Visual feedback with animated recording indicator
- Duration tracking

### 🤖 AI-Powered Insights
- **AI Summary**: Automatically generates concise summaries of your voice notes
- **Action Items**: Extracts actionable tasks from your recordings
- **Transcription**: Voice-to-text conversion (ready for AI API integration)

### 📝 Note Management
- Create, edit, and delete voice notes
- Pin important notes
- Search through your notes
- Clean, intuitive interface

### 📱 Modern Design
- Beautiful, minimalist UI
- Dark mode support ready
- Smooth animations
- Responsive layout

## Tech Stack

- **Framework**: React Native with Expo
- **Storage**: AsyncStorage for local data persistence
- **Architecture**: Clean, component-based architecture

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npx expo start
```

3. Run on your preferred platform:
- **Web**: `npx expo start --web`
- **Android**: `npx expo start --android`
- **iOS**: `npx expo start --ios`

## Customization

### Adding Real AI
Replace the simulated AI functions in App.js with real AI API calls:

```javascript
// Replace generateAISummary() with actual API call
const generateAISummary = async (transcript) => {
  const response = await fetch('YOUR_AI_API', {
    method: 'POST',
    body: JSON.stringify({ text: transcript })
  })
  return response.json()
}
```

### Recommended AI APIs
- **OpenAI Whisper**: Transcription
- **OpenAI GPT**: Summarization
- **AssemblyAI**: Transcription + Summarization


## License

Sell on Gumroad, CodeCanyon, or your own platform.

---

Build date: 2026
