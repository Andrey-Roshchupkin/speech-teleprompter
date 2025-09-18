# 🎤 Speech Teleprompter

A modern, real-time speech recognition teleprompter application that automatically scrolls through your script as you speak. Built with vanilla JavaScript and following SOLID architecture principles.

## ✨ Features

### 🎯 Core Functionality

- **Real-time Speech Recognition**: Automatically recognizes speech and matches it to your script
- **Intelligent Fuzzy Matching**: Uses advanced fuzzy matching algorithms to handle speech recognition errors
- **Auto-scrolling**: Automatically scrolls through your script as you speak
- **Visual Feedback**: Highlights current and matched words in real-time

### 📺 Advanced Display Options

- **Picture-in-Picture (PiP) Mode**: Display teleprompter in a separate floating window
- **Customizable Display**: Adjustable text size, lines to show, and scroll trigger settings
- **Progress Tracking**: Visual progress bar showing your position in the script
- **Responsive Design**: Works on desktop and mobile devices

### 📎 Attachment Support

- **Rich Content**: Embed images, videos, or other content within your script
- **Smart Navigation**: Automatically skips attachment names during speech recognition
- **Contextual Display**: Shows relevant attachments based on your current position

### ⚙️ Customization

- **Multiple Languages**: Support for various speech recognition languages
- **Adjustable Precision**: Fine-tune fuzzy matching sensitivity
- **Persistent Settings**: All settings are automatically saved and restored
- **Theme Support**: Clean, professional interface

## 🚀 Quick Start

### Prerequisites

- Modern web browser with Web Speech API support
- HTTPS connection (required for microphone access)
- Microphone access permissions

### Installation

1. **Clone or download** the project files
2. **Open `index.html`** in a modern web browser
3. **Allow microphone access** when prompted
4. **Start speaking** your script!

### Basic Usage

1. **Enter your script** in the text area
2. **Adjust settings** (text size, scroll trigger, etc.)
3. **Click "Start"** to begin speech recognition
4. **Speak your script** - the teleprompter will automatically scroll and highlight words
5. **Use PiP mode** for a distraction-free presentation experience

## 🏗️ Architecture

This project follows **SOLID principles** with a clean, modular architecture:

### Core Components

```
📁 js/
├── 🎯 app.js                    # Main application orchestrator
├── 🧠 core/
│   └── TeleprompterCore.js     # Central coordination hub
├── 📋 managers/                 # Specialized managers (SRP)
│   ├── AttachmentManager.js    # Handles attachments and rich content
│   ├── DisplayManager.js       # Manages text rendering and styling
│   ├── PictureInPictureManager.js # PiP window functionality
│   ├── ScrollManager.js        # Handles scrolling and viewport
│   ├── SettingsManager.js      # Manages user preferences
│   └── BaseManager.js          # Common base class
├── 🎤 speech-recognition.js    # Web Speech API wrapper
├── 🔍 fuzzy-matcher.js         # Intelligent text matching
└── 💾 local-storage.js         # Persistent data management
```

### Design Patterns

- **Manager Pattern**: Each manager handles a specific domain
- **Observer Pattern**: Event-driven updates between components
- **Strategy Pattern**: Pluggable fuzzy matching algorithms
- **Factory Pattern**: Dynamic manager instantiation

## 🎛️ Configuration

### Speech Recognition Settings

| Setting              | Description                  | Default |
| -------------------- | ---------------------------- | ------- |
| **Primary Language** | Speech recognition language  | `en-US` |
| **Fuzzy Precision**  | Matching sensitivity (0-100) | `65%`   |

### Display Settings

| Setting            | Description               | Default |
| ------------------ | ------------------------- | ------- |
| **Text Size**      | Font size in pixels       | `22px`  |
| **Lines to Show**  | Visible lines in viewport | `4`     |
| **Scroll Trigger** | Lines before auto-scroll  | `3`     |

### Advanced Features

- **Auto-skip Attachments**: Automatically advances past attachment names
- **Smart Position Recovery**: Handles speech recognition errors gracefully
- **Cross-window Synchronization**: Maintains state between main and PiP windows

## 🔧 Technical Details

### Browser Compatibility

- **Chrome/Edge**: Full support with Web Speech API
- **Firefox**: Limited speech recognition support
- **Safari**: Basic functionality (no speech recognition)
- **Mobile**: iOS Safari, Chrome Mobile supported

### Performance Optimizations

- **Batched DOM Updates**: Uses `requestAnimationFrame` for smooth rendering
- **Efficient Matching**: Optimized fuzzy matching algorithms
- **Memory Management**: Proper cleanup and event listener management
- **Responsive Scrolling**: Smooth, hardware-accelerated scrolling

### Security & Privacy

- **Local Processing**: Speech recognition happens in your browser
- **No Data Transmission**: Script content never leaves your device
- **HTTPS Required**: Secure connection for microphone access
- **Permission-based**: Explicit user consent for microphone access

## 📱 Usage Scenarios

### 🎬 Video Production

- **Script Reading**: Perfect for video content creation
- **Live Streaming**: Use PiP mode for live presentations
- **Multi-take Recording**: Easy script navigation for multiple takes

### 🎤 Public Speaking

- **Presentations**: Professional teleprompter for speeches
- **Training Sessions**: Interactive script-based training
- **Webinars**: Distraction-free presentation mode

### 📚 Educational Content

- **Language Learning**: Practice pronunciation with visual feedback
- **Accessibility**: Support for users with reading difficulties
- **Interactive Learning**: Engaging script-based activities

## 🛠️ Development

### Project Structure

```
speech-rec/
├── 📄 index.html              # Main HTML file
├── 🎨 styles.css              # Application styles
├── 📖 README.md               # This file
├── 🏗️ ARCHITECTURE.md         # Detailed architecture docs
└── 📁 js/                     # JavaScript modules
```

### Key Technologies

- **Vanilla JavaScript**: No frameworks, pure ES6+ modules
- **Web Speech API**: Browser-native speech recognition
- **CSS Grid/Flexbox**: Modern responsive layout
- **Document Picture-in-Picture API**: Native PiP support
- **Local Storage API**: Persistent settings

### Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Follow SOLID principles**
4. **Add tests for new features**
5. **Submit a pull request**

## 🐛 Troubleshooting

### Common Issues

**Speech Recognition Not Working**

- Ensure HTTPS connection
- Check microphone permissions
- Try different browser (Chrome recommended)

**PiP Mode Not Available**

- Use Chrome/Edge browser
- Check browser version (requires recent version)
- Ensure popup blockers are disabled

**Script Not Scrolling**

- Check fuzzy precision settings
- Ensure clear speech pronunciation
- Verify script text matches spoken words

### Debug Mode

Enable debug logging by opening browser console to see detailed operation logs.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Web Speech API** for browser-native speech recognition
- **Fuzzy matching algorithms** for intelligent text matching
- **Modern CSS** for responsive design
- **SOLID principles** for clean architecture

---

**Made with ❤️ for content creators, speakers, and educators worldwide.**
