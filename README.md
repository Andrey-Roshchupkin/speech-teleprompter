# 🎤 Speech Teleprompter

A modern web-based teleprompter application with speech recognition capabilities. Built with Vue 3, TypeScript, and the Web Speech API.

## ✨ Features

- 🎯 **Speech Recognition**: Real-time speech-to-text with fuzzy matching
- 📝 **Script Management**: Easy script editing and management
- 🎨 **Modern UI**: Clean, responsive interface
- ⚡ **Fast Performance**: Optimized fuzzy matching algorithm
- 🔧 **Customizable**: Adjustable settings for precision and display
- 📱 **Responsive**: Works on desktop and mobile devices

## 🚀 Live Demo

[View Live Demo](https://your-username.github.io/speech-teleprompter/)

## 🛠️ Technology Stack

- **Frontend**: Vue 3 + TypeScript
- **Build Tool**: Vite
- **State Management**: Pinia
- **Testing**: Vitest + Vue Test Utils
- **Linting**: ESLint + Prettier
- **Deployment**: GitHub Pages

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/speech-teleprompter.git
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

#### Option 1: Deploy to main branch (Recommended)

```bash
# Deploy to main branch
npm run deploy:main

# Or use script directly
./deploy-main.sh
```

#### Option 2: Deploy to gh-pages branch

```bash
# Deploy to separate gh-pages branch
npm run deploy

# Or step by step
npm run build:prod
npx gh-pages -d dist
```

### First-time Setup

1. **Create GitHub repository** and push your code
2. **Run deployment** using one of the methods above
3. **Enable GitHub Pages** in repository settings:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` (if using main) or `gh-pages` (if using separate branch)
4. **Your app will be available** at: `https://Andrey-Roshchupkin.github.io/speech-teleprompter/`

## 🎯 How It Works

1. **Speech Recognition**: Uses the Web Speech API to convert speech to text
2. **Fuzzy Matching**: Implements a sliding window algorithm to match spoken words with script text
3. **Real-time Updates**: Updates the teleprompter position based on speech recognition results
4. **Smart Scoring**: Uses bonus scoring for end-of-phrase matches to improve accuracy

## 🔧 Configuration

- **Precision**: Adjust fuzzy matching sensitivity (50-95%)
- **Display Settings**: Customize text size, lines to show, and scroll behavior
- **Language Support**: Multiple language options for speech recognition

## 📱 Browser Support

- Chrome/Chromium (recommended)
- Edge
- Safari (limited support)
- Firefox (limited support)

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
- All contributors and testers
