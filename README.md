# Commander

> A modern GUI for Claude Code CLI - manage your AI coding sessions with ease

![TypeScript](https://img.shields.io/badge/TypeScript-4.5.4-blue)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![Electron](https://img.shields.io/badge/Electron-37.1.0-47848F)
![License](https://img.shields.io/badge/license-MIT-green)

Commander is an Electron-based desktop application that provides a sleek, modern interface for managing Claude Code CLI sessions. It transforms the command-line experience into an intuitive GUI, making it easier to create, manage, and visualize AI-powered coding conversations.

## ✨ Features

- **🚀 Session Management** - Create new sessions, continue existing ones, or resume from history
- **💬 Real-time Streaming** - Live conversation display with Claude's responses as they stream
- **🛠️ Tool Visualization** - Beautiful widgets for file edits, bash commands, todos, and more
- **📁 Project Discovery** - Automatically find existing Claude sessions across your projects
- **📜 Session History** - Browse and reload past conversations
- **🎯 Multi-session Support** - Manage multiple active sessions simultaneously

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- [Claude Code CLI](https://claude.ai/code) installed and accessible in PATH
- macOS, Windows, or Linux

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/commander-in-chief.git
cd commander-in-chief

# Install dependencies
npm install

# Start the application
npm start
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm start              # Start app in development mode

# Code Quality
npm run lint           # Check code with ESLint
npm run lint:fix       # Auto-fix linting issues
npm run typecheck      # TypeScript type checking
npm run check          # Combined lint + typecheck

# Build & Distribution
npm run package        # Package app for current platform
npm run make           # Create distributables
npm run publish        # Publish app (requires configuration)
```

### Project Structure

```
commander-in-chief/
├── src/
│   ├── main/          # Electron main process
│   │   ├── app/       # Application entry
│   │   ├── ipc/       # IPC handlers
│   │   └── utils/     # Core utilities
│   ├── renderer/      # React frontend
│   │   ├── components/# UI components
│   │   └── hooks/     # React hooks
│   └── shared/        # Shared types
├── forge.config.ts    # Electron Forge config
├── webpack.*.ts       # Webpack configs
└── package.json       # Project metadata
```

## 🔧 Architecture

### Core Components

- **ClaudeManager** - Manages Claude CLI sessions and processes
- **ClaudeStreamParser** - Parses streaming JSON from Claude CLI
- **SessionStore** - Handles persistent session storage
- **Tool Widgets** - Specialized components for visualizing Claude's tool outputs

### Security

- Context isolation enabled
- Node integration disabled in renderer
- Secure IPC communication via preload script
- Production-ready Electron security fuses

## 🎨 UI Features

### Tool-Specific Widgets

- **Bash Widget** - Command execution with syntax highlighting
- **Edit Widget** - File modification diffs
- **Read Widget** - File content display
- **Write Widget** - New file creation
- **Todo Widget** - Task list management
- **Web Search Widget** - Search result display

### Design System

- Modern dark theme with gradient accents
- Responsive layout that adapts to content
- Smooth animations and transitions
- Accessible color contrast and typography

## 📦 Building

### Package for Current Platform

```bash
npm run package
```

### Create Distributables

```bash
npm run make
```

This creates platform-specific installers:
- **Windows**: Squirrel installer
- **macOS**: ZIP archive
- **Linux**: DEB and RPM packages

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI powered by [React](https://react.dev/) and [TailwindCSS](https://tailwindcss.com/)
- Icons from [Lucide](https://lucide.dev/)
- Designed for [Claude Code CLI](https://claude.ai/code)

---

Made by Andre Dalwin and Claude Code