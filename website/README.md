# Linux System Map - Interactive Architecture Visualization

An interactive, comprehensive visualization of the Linux system architecture with deep CS theory integration and practical examples.

## Features

### Core Visualization
- **Interactive Tree Structure**: Expandable/collapsible nodes representing all Linux subsystems
- **Color-Coded Categories**: Visual distinction between kernel, userspace, filesystem, network, and service components
- **Smart Search**: Real-time filtering and highlighting of nodes with Web Worker acceleration
- **Responsive Design**: Optimized for desktop and mobile devices
- **Progressive Web App**: Install as standalone app with offline support

### Comprehensive Information Panel
- **Tabbed Interface**: Organized content across Overview, Commands, Files, CS Theory, Performance, and Examples
- **Breadcrumb Navigation**: Track your location in the system hierarchy
- **Command Simulator**: Visual command execution demonstration
- **Syntax Highlighting**: Color-coded command and code examples
- **Performance Metrics**: O-notation complexity, latencies, and throughput data
- **CS Concepts**: Mapped algorithms, data structures, and theory to each component

### Content Coverage
- **200+ Nodes**: Complete Linux system architecture
- **Kernel Subsystems**: Process management, memory, I/O, IPC, security
- **Networking Stack**: Full TCP/IP implementation, netfilter, traffic control
- **Filesystem Hierarchy**: FHS 3.0 compliant structure
- **System Services**: systemd, containers, databases, web servers
- **Practical Examples**: Real-world commands with descriptions

## Quick Start

### Local Development
1. Clone the repository
2. Open `index.html` in a web browser
3. Or use a local server: `python3 -m http.server 8000`

### Deployment to Vercel

1. Push to GitHub:
```bash
git init
git add .
git commit -m "Initial Linux system map"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

2. Deploy on Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Git Repository"
   - Select your repository
   - Click "Deploy" (no configuration needed)

## Project Structure

```
linux-system-map/
├── index.html          # Main application (all-in-one)
├── data/
│   ├── kernel.json     # Kernel subsystem data
│   ├── network.json    # Networking stack data
│   ├── filesystem.json # Filesystem hierarchy
│   └── services.json   # System services data
├── vercel.json         # Vercel deployment config
├── README.md           # This file
└── CLAUDE.md           # Development guide
```

## Technology Stack

- **Pure HTML/CSS/JavaScript**: No external dependencies
- **Modular JSON Data**: Easily maintainable content structure
- **CSS Grid & Flexbox**: Modern responsive layout
- **ES6+**: Modern JavaScript features

## Key Features by Phase

### Phase 1: Core Structure ✅
- Tree visualization with Linux system branches
- Expandable/collapsible functionality
- Color coding by node type
- Hover tooltips
- Search functionality
- Responsive design

### Phase 2: Data Structure ✅
- Comprehensive JSON data files
- CS concepts integration
- Performance metrics
- Command examples
- System call references

### Phase 3: Information Panel ✅
- Tabbed interface
- Breadcrumb navigation
- Command simulator
- Syntax highlighting
- Performance metrics display
- Examples with explanations

### Phase 4: Advanced Navigation ✅
- Multiple view modes (Tree, Graph, Table)
- Command palette (Ctrl+P)
- Bookmarks and history
- Vim-style keyboard navigation
- Mini-map for large trees
- Deep linking to nodes

### Phase 5: Learning Features ✅
- Learning paths with modules
- Quiz system with explanations
- Challenges with hints
- Achievement system
- Progress tracking
- Theme switcher (dark/light/high-contrast)

### Phase 6: Performance & Polish ✅
- Web Worker for search operations
- Debounced search input
- RequestAnimationFrame optimizations
- PWA with offline support
- Service Worker caching
- ARIA labels for accessibility
- Performance monitoring
- Install prompt for desktop/mobile

## Usage Guide

### Navigation
- **Click nodes** to expand/collapse and view details
- **Search** with Ctrl+F to filter nodes (powered by Web Worker)
- **Tab through** information sections
- **Copy commands** with one-click buttons
- **Try commands** in the visual simulator
- **Command Palette** with Ctrl+P for quick navigation
- **Vim shortcuts** j/k for up/down, h/l for collapse/expand
- **Bookmarks** with B key, view with Shift+B
- **Install as app** when prompted or via browser menu

### Learning Paths
- **Beginners**: Start with Filesystem and User Space nodes
- **Intermediate**: Explore System Services and Networking
- **Advanced**: Dive into Kernel subsystems and performance metrics
- **CS Students**: Focus on Theory tabs for algorithms and data structures

## Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (responsive design)

## Performance

- **Load Time**: < 2 seconds with Service Worker caching
- **Search Response**: Instant filtering via Web Worker
- **Smooth Animations**: 60fps with RequestAnimationFrame optimization
- **Optimized**: Lazy loading for large trees
- **Offline Support**: Full functionality without internet
- **Memory Efficient**: Virtual scrolling for large lists
- **Debounced Input**: Prevents excessive processing

## Contributing

This is an educational tool designed to help understand Linux architecture. Contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Add or improve content in JSON files
4. Test locally
5. Submit a pull request

## Completed Features

All planned phases have been successfully implemented:

- ✅ Network graph view mode
- ✅ Learning path progression tracking
- ✅ Interactive quizzes with scoring
- ✅ Command history tracking
- ✅ Dark/light/high-contrast themes
- ✅ Bookmarks and history
- ✅ Achievement system
- ✅ PWA with offline support
- ✅ Web Worker search
- ✅ Accessibility (ARIA labels)
- ✅ Performance monitoring
- ✅ Challenge system

## Potential Future Enhancements

- [ ] Export to PDF/PNG
- [ ] Community annotations
- [ ] Multi-language support
- [ ] Collaborative learning features
- [ ] Integration with real Linux systems
- [ ] Advanced visualization modes

## Educational Value

This tool bridges the gap between:
- **Theory and Practice**: CS concepts mapped to real Linux components
- **Commands and Understanding**: Not just what to type, but why
- **Architecture and Implementation**: See how pieces fit together
- **Learning and Doing**: Interactive exploration encourages experimentation

## License

MIT License - Free for educational use

## Credits

Created as an interactive learning tool for the book "Linux in the AI Era" - demonstrating how understanding system architecture amplifies AI collaboration capabilities.

---

**Live Demo**: Deploy to Vercel for instant hosting

**Feedback**: Open an issue on GitHub

**Learn More**: Each node contains curated information from kernel documentation, man pages, and system administration best practices.