# 📊 TranscriptPro - Professional YouTube Transcript Suite

> **Professional YouTube transcript extraction with bulk operations, multiple export formats, and advanced analytics.**

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/yourusername/transcriptpro)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome Web Store](https://img.shields.io/badge/chrome--web--store-available-red.svg)](#)

## ✨ Features

### 🎯 **Core Functionality**
- **One-click transcript extraction** from any YouTube video
- **Bulk operations** - extract multiple videos simultaneously
- **Real-time video detection** across all browser tabs
- **Professional UI** with multi-tab interface (Dashboard, Videos, Export, Settings)

### 📊 **Analytics Dashboard**
- **Live statistics** - track open videos, extracted transcripts, word counts
- **Usage analytics** - monitor your extraction patterns and productivity
- **Performance metrics** - estimated durations and extraction success rates
- **Activity history** - recent actions and transcript management

### 📤 **Export Capabilities**
- **4 Export formats**: Plain Text, JSON, CSV, Markdown
- **Bulk export** - download multiple transcripts at once
- **Custom formatting** - includes video metadata and timestamps
- **Direct file download** - no copy-paste required

### 🔧 **Advanced Features**
- **Search & filter** videos by title
- **Sort options** - by date, title, or duration
- **Transcript preview** - modal popups before copying
- **Settings management** - customize default export format and privacy options
- **Keyboard shortcuts** - `Ctrl+Shift+T` (Windows) / `Cmd+Shift+T` (Mac)

## 🚀 Quick Start

### Prerequisites
- Google Chrome browser (version 88+)
- Active internet connection
- YouTube videos with available transcripts

### Installation

#### Option 1: Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) *(link coming soon)*
2. Search for "TranscriptPro"
3. Click "Add to Chrome"
4. Grant necessary permissions

#### Option 2: Developer Installation

1. **Download the extension**
   ```bash
   git clone https://github.com/yourusername/transcriptpro.git
   cd transcriptpro
   ```

2. **Open Chrome Extensions page**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)

3. **Load the extension**
   - Click "Load unpacked"
   - Select the `transcriptpro` folder
   - The extension icon should appear in your toolbar

4. **Verify installation**
   - Open any YouTube video
   - Click the TranscriptPro icon
   - You should see the professional dashboard interface

## 📖 Usage Guide

### Basic Usage

1. **Open YouTube videos** in your browser tabs
2. **Click the TranscriptPro icon** in your Chrome toolbar
3. **Navigate to the Videos tab** to see all detected YouTube videos
4. **Click "Copy"** on any video to extract and copy its transcript
5. **Use bulk operations** to handle multiple videos at once

### Dashboard Overview

#### 📊 **Dashboard Tab**
- **Open Videos**: Current YouTube tabs detected
- **Extracted Today**: Transcripts processed in current session
- **Total Words**: Cumulative word count across all extractions
- **Avg Duration**: Estimated average video length

#### 🎥 **Videos Tab**
- **Search bar**: Filter videos by title
- **Sort options**: Organize by date, title, or duration
- **Bulk selection**: Select multiple videos with checkboxes
- **Actions per video**:
  - **Copy**: Extract and copy transcript to clipboard
  - **Preview**: View transcript excerpt in modal
  - **View**: Switch to that YouTube tab

#### 📤 **Export Tab**
- **Plain Text**: Simple .txt format
- **JSON**: Structured data with metadata
- **CSV**: Spreadsheet-compatible format
- **Markdown**: Formatted text with headers

#### ⚙️ **Settings Tab**
- **Auto-refresh**: Automatically update video list when switching tabs
- **Default export format**: Set preferred download format
- **Privacy options**: Clear data on browser close

### Advanced Features

#### Bulk Operations
1. **Select videos** using checkboxes in the Videos tab
2. **Use "Select All"** to choose all detected videos
3. **Click bulk actions**:
   - **Copy Selected**: Extract all selected transcripts to clipboard
   - **Export Selected**: Download selected transcripts in chosen format

#### Export Formats

**Plain Text (.txt)**
```
Title: Video Title Here
URL: https://youtube.com/watch?v=abc123

Transcript content here...
```

**JSON (.json)**
```json
[
  {
    "title": "Video Title Here",
    "url": "https://youtube.com/watch?v=abc123",
    "videoId": "abc123",
    "transcript": "Transcript content...",
    "wordCount": 1250,
    "extractedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**CSV (.csv)**
```csv
Title,URL,Video ID,Word Count,Transcript
"Video Title","https://youtube.com/...","abc123","1250","Transcript..."
```

**Markdown (.md)**
```markdown
# Video Title Here

**URL:** https://youtube.com/watch?v=abc123
**Video ID:** abc123
**Word Count:** 1250

## Transcript

Transcript content here...
```

## 🏗️ Technical Architecture

### File Structure
```
transcriptpro/
├── manifest.json          # Extension configuration
├── popup.html             # Main UI interface
├── popup.js               # Core application logic
├── youtube-content.js     # YouTube page interaction
├── background.js          # Service worker for analytics
└── README.md              # This documentation
```

### Key Components

#### **TranscriptPro Class** (`popup.js`)
- **Main application controller**
- **State management** for videos, settings, statistics
- **Event handling** for UI interactions
- **Storage management** using Chrome storage APIs

#### **YouTube Content Script** (`youtube-content.js`)
- **Transcript extraction** from YouTube's DOM
- **DOM manipulation** to access transcript elements
- **Message passing** with main extension
- **Error handling** for various YouTube layouts

#### **Background Service Worker** (`background.js`)
- **Analytics tracking** for usage patterns
- **Extension lifecycle management**
- **Data cleanup** and storage optimization
- **Tab monitoring** for YouTube detection

### Storage Architecture

#### **Settings Storage**
```javascript
transcriptProSettings: {
  autoRefresh: true,
  defaultFormat: 'txt',
  clearOnClose: false,
  version: '3.0.0'
}
```

#### **Statistics Storage**
```javascript
transcriptProStats: {
  totalVideos: 0,
  totalTranscripts: 0,
  totalWords: 0,
  avgDuration: '0m',
  installDate: 1640995200000,
  lastUsed: 1640995200000
}
```

#### **Analytics Storage**
```javascript
transcriptProAnalytics: {
  installations: [
    { reason: 'install', timestamp: 1640995200000, version: '3.0.0' }
  ],
  usage: [
    { action: 'copy', timestamp: 1640995200000 }
  ]
}
```

## 🔧 Development

### Setup Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/transcriptpro.git
   cd transcriptpro
   ```

2. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the project directory

3. **Enable hot reload** (optional)
   - Install the Extensions Reloader extension
   - Enable automatic reloading during development

### Code Structure

#### **Main Application** (`popup.js`)
```javascript
class TranscriptPro {
  constructor() {
    this.videos = [];           // Current YouTube videos
    this.selectedVideos = new Set(); // Selected for bulk operations
    this.settings = {};         // User preferences
    this.stats = {};           // Usage statistics
  }
  
  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    await this.loadVideos();
    this.updateDashboard();
  }
}
```

#### **Content Script** (`youtube-content.js`)
```javascript
function extractTranscript() {
  return new Promise((resolve, reject) => {
    // Find transcript container
    let transcriptContainer = document.querySelector('ytd-transcript-segment-list-renderer');
    
    // Click transcript button if needed
    if (!transcriptContainer) {
      const transcriptButtons = document.querySelectorAll('button')
        .filter(btn => btn.textContent.toLowerCase().includes('transcript'));
      // ... extraction logic
    }
  });
}
```

### Adding New Features

#### **Adding a new export format**
1. **Update export options** in `popup.html`
2. **Add format handling** in `formatTranscript()` method
3. **Update export cards** click handlers
4. **Test with sample data**

#### **Adding new analytics**
1. **Define new tracking events** in `background.js`
2. **Add event listeners** in relevant components
3. **Update dashboard** to display new metrics
4. **Update storage schema** if needed

## 🔐 Privacy & Security

### Data Handling
- **Local storage only** - all data stays on your device
- **No external servers** - no data transmission to third parties
- **Chrome storage API** - secure, encrypted local storage
- **Optional data clearing** - automatic cleanup on browser close

### Permissions Required
- **activeTab**: Access current tab for transcript extraction
- **tabs**: Detect YouTube videos across browser tabs
- **scripting**: Inject content scripts into YouTube pages
- **storage**: Save settings and analytics locally

### Security Features
- **Content Security Policy** (CSP) compliant
- **Manifest V3** - latest Chrome extension security standards
- **Minimal permissions** - only request necessary access
- **No eval()** or unsafe JavaScript practices

## 🐛 Troubleshooting

### Common Issues

#### **"No transcript found" error**
- **Cause**: Video doesn't have transcript available
- **Solution**: Try videos with closed captions enabled
- **Workaround**: Check if transcript button exists on YouTube player

#### **Extension not detecting YouTube videos**
- **Cause**: Videos not fully loaded or invalid URLs
- **Solution**: Refresh the YouTube page and wait for full load
- **Check**: Ensure URL contains `/watch?v=` parameter

#### **Bulk operations failing**
- **Cause**: Too many videos selected or browser memory limits
- **Solution**: Select fewer videos (recommended: <10 at once)
- **Alternative**: Use individual copy operations

#### **Export downloads not working**
- **Cause**: Browser download permissions or popup blockers
- **Solution**: Allow downloads in Chrome settings
- **Check**: Ensure popup blockers aren't interfering

### Performance Optimization

#### **For large transcript batches**
```javascript
// Process in smaller chunks
const chunkSize = 5;
for (let i = 0; i < videos.length; i += chunkSize) {
  const chunk = videos.slice(i, i + chunkSize);
  await Promise.all(chunk.map(video => processVideo(video)));
  await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
}
```

#### **Memory management**
- **Automatic cleanup** of old activities (keeps last 50)
- **Storage limits** for analytics data (1000 usage events)
- **Efficient DOM queries** with caching
- **Lazy loading** of transcript data

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- **Follow existing code style** and patterns
- **Add comments** for complex logic
- **Test thoroughly** with various YouTube videos
- **Update documentation** for new features

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/transcriptpro/issues)
- **Email**: support@transcriptpro.com
- **Documentation**: [Full user guide](https://github.com/yourusername/transcriptpro/wiki)

## 🗺️ Roadmap

### Version 3.1 (Next Release)
- [ ] Cloud sync for settings and analytics
- [ ] Transcript history with persistent storage
- [ ] Advanced search with keyword highlighting
- [ ] Custom export templates

### Version 3.2 (Future)
- [ ] Team collaboration features
- [ ] API access for enterprise users
- [ ] Advanced analytics dashboard
- [ ] Integration with note-taking apps

### Version 4.0 (Long-term)
- [ ] AI-powered transcript summarization
- [ ] Multi-language transcript translation
- [ ] Voice-to-text annotation features
- [ ] Advanced data visualization

---

**Built with ❤️ for productivity enthusiasts who need professional transcript management.**

*TranscriptPro v3.0.0 - Transform your YouTube research workflow*