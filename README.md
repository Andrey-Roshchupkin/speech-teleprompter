# 🎤 Speech Teleprompter

A modern web-based teleprompter application with real-time speech recognition and Picture-in-Picture support. Built with Vue 3, TypeScript, and the Web Speech API.

## ✨ Features

- 🎯 **Real-time Speech Recognition**: Advanced speech-to-text with fuzzy matching algorithm
- 📺 **Picture-in-Picture Mode**: Move teleprompter to floating window while preserving state
- 📝 **Script Management**: Easy script editing with word count and progress tracking
- 🎨 **Modern UI**: Clean, responsive interface with dark theme
- ⚡ **Fast Performance**: Optimized fuzzy matching with sliding window algorithm
- 🔧 **Customizable Settings**: Adjustable text size, lines to show, and scroll behavior
- 🌍 **Multi-language Support**: Speech recognition in multiple languages
- 📊 **Analytics**: Built-in Google Analytics for usage tracking
- 💾 **Local Storage**: Automatic saving of settings and scripts
- 📱 **Responsive Design**: Works on desktop and mobile devices

## 🚀 Live Demo

[View Live Demo](https://andrey-roshchupkin.github.io/speech-teleprompter/)

## 🛠️ Technology Stack

- **Frontend**: Vue 3 + TypeScript
- **Build Tool**: Vite
- **State Management**: Pinia
- **Speech Recognition**: Web Speech API
- **Picture-in-Picture**: Document Picture-in-Picture API
- **Analytics**: Google Analytics 4
- **Testing**: Vitest + Vue Test Utils
- **Linting**: ESLint + Prettier
- **Deployment**: GitHub Pages

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Andrey-Roshchupkin/speech-teleprompter.git
cd speech-teleprompter

# Install dependencies
npm install
```

## 🏃‍♂️ Development

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Run linting
npm run lint

# Format code
npm run format
```

## 🏗️ Building for Production

```bash
# Build for production
npm run build:prod

# Preview production build
npm run preview
```

## 🚀 Deployment

### Manual Deployment to GitHub Pages

```bash
# Deploy to main branch
npm run deploy:main

# Or use script directly
./deploy-main.sh
```

### First-time Setup

1. **Create GitHub repository** and push your code
2. **Run deployment** using the method above
3. **Enable GitHub Pages** in repository settings:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main`

## 🎯 How It Works

1. **Speech Recognition**: Uses the Web Speech API to convert speech to text in real-time
2. **Fuzzy Matching**: Implements a sliding window algorithm to match spoken words with script text
3. **Real-time Updates**: Updates the teleprompter position based on speech recognition results
4. **Smart Scoring**: Uses bonus scoring for end-of-phrase matches to improve accuracy
5. **Picture-in-Picture**: Moves the teleprompter to a floating window while preserving all state
6. **Auto-scroll**: Automatically scrolls the text based on speech progress and user settings
7. **State Management**: Centralized state management with Pinia for consistent data flow

## 🔧 Configuration

- **Text Size**: Adjustable font size (12-48px)
- **Lines to Show**: Control how many lines are visible (3-10)
- **Scroll Trigger**: Set when auto-scroll activates (1 to lines-1)
- **Language Support**: Multiple language options for speech recognition
- **Auto-save**: Settings and scripts are automatically saved to local storage
- **Debug Logging**: Configurable log levels for troubleshooting

## 📱 Browser Support

- **Chrome/Chromium** (recommended - full support)
- **Microsoft Edge** (full support)
- **Safari** (limited support - no Picture-in-Picture)
- **Firefox** (limited support - no Picture-in-Picture)

### Feature Support Matrix

| Feature            | Chrome | Edge | Safari | Firefox |
| ------------------ | ------ | ---- | ------ | ------- |
| Speech Recognition | ✅     | ✅   | ⚠️     | ❌      |
| Picture-in-Picture | ✅     | ✅   | ❌     | ❌      |
| Auto-scroll        | ✅     | ✅   | ✅     | ✅      |
| Local Storage      | ✅     | ✅   | ✅     | ✅      |

## 🆕 Recent Updates

### v2.0.0 - Major Features

- 📺 **Picture-in-Picture Mode**: Move teleprompter to floating window
- 🔄 **Enhanced Auto-scroll**: Improved scroll behavior with state preservation
- 📊 **Google Analytics**: Built-in usage tracking and analytics
- 💾 **Auto-save**: Automatic saving of settings and scripts
- 🎨 **UI Improvements**: Better styling and user experience
- 🐛 **Bug Fixes**: Improved stability and performance

### Key Improvements

- **State Management**: Centralized state with Pinia
- **Error Handling**: Better error handling and user feedback
- **Performance**: Optimized rendering and memory usage
- **Accessibility**: Improved keyboard navigation and screen reader support

## 📊 Analytics

The application includes Google Analytics 4 for tracking:

- User engagement and session duration
- Feature usage (speech recognition, PiP mode)
- Browser and device statistics
- Geographic distribution of users

All data collection is anonymous and GDPR compliant.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Vue.js team for the amazing framework
- Web Speech API for speech recognition capabilities
- Document Picture-in-Picture API for floating window support
- Google Analytics for usage tracking
- All contributors and testers

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/Andrey-Roshchupkin/speech-teleprompter/issues) page
2. Create a new issue with detailed description
3. Include browser version and error messages if applicable

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
