# CLAUDE.md - Linux Interactive System Map Implementation Guide

## Project Overview
Interactive visualization of Linux system architecture for deployment on Vercel. Single-page application with no external dependencies, covering all Linux subsystems and CS concepts.

## Development Setup

### Project Structure
```
linux-system-map/
├── index.html          # Main application (all-in-one)
├── data/
│   ├── kernel.json     # Kernel subsystem data
│   ├── network.json    # Networking stack data
│   ├── filesystem.json # Filesystem hierarchy
│   └── services.json   # System services data
├── README.md           # User documentation
├── CLAUDE.md           # This file - dev guide
├── vercel.json         # Vercel configuration
└── package.json        # Optional: for development tools
```

### Vercel Deployment
```bash
# Initial setup
git init
git add .
git commit -m "Initial Linux system map"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main

# Connect to Vercel
# 1. Go to vercel.com
# 2. Import Git Repository
# 3. Select your repo
# 4. Deploy (no config needed)
```

## Implementation Prompts for Claude Code

### Phase 1: Core Structure and Visualization
```markdown
Create an interactive Linux system map in index.html with these requirements:

1. Single HTML file with embedded CSS and JavaScript
2. Tree structure with these main branches:
   - Kernel Space (Process Management, Memory Management, I/O System)
   - User Space (Shell, System Libraries, Applications)
   - Filesystem (/bin, /etc, /proc, /sys, /dev)
   - Networking (TCP/IP Stack, Network Interfaces, iptables)
   - System Services (systemd, cron, logging)

3. Each node should have:
   - Expandable/collapsible functionality
   - Color coding by type
   - Hover tooltips with descriptions
   - Click to show detailed panel

4. Include search functionality that filters and highlights nodes
5. Add smooth animations for all interactions
6. Use CSS Grid for layout, SVG for connection lines
7. Make it responsive for mobile and desktop
```

### Phase 2: Data Structure and Content
```markdown
Enhance the Linux system map with comprehensive data structure:

1. Convert hardcoded content to JSON data structure with this schema:
   {
     id: string,
     name: string,
     type: "kernel|userspace|filesystem|network|service",
     level: "beginner|intermediate|advanced",
     metadata: {
       path: string,
       description: string,
       created_by: string,
       managed_by: string
     },
     connections: {
       reads_from: string[],
       writes_to: string[],
       controls: string[],
       controlled_by: string[]
     },
     operations: {
       commands: [{cmd, description, example, requires}],
       system_calls: string[],
       config_files: [{path, format, editable}]
     },
     cs_concepts: {
       category: string[],
       topics: string[],
       difficulty: string
     },
     children: Node[]
   }

2. Add complete Linux kernel subsystems:
   - Process scheduler (CFS, RT, Deadline)
   - Memory management (Virtual memory, Page tables, SLAB)
   - I/O subsystem (Block layer, VFS, Device mapper)
   - IPC mechanisms (Pipes, Sockets, Shared memory)

3. Include practical examples for each node
4. Add performance characteristics and complexity info
```

### Phase 3: Information Panel System
```markdown
Add a comprehensive information panel system:

1. Create tabbed panel that appears when clicking nodes:
   - Overview: Description and purpose
   - Commands: Executable commands with examples
   - Files: Configuration and system files
   - Connections: Related components
   - CS Theory: Underlying concepts
   - Performance: Metrics and optimization

2. Features:
   - Syntax highlighting for code
   - Copy buttons for commands
   - Collapsible sections
   - Cross-references to related nodes
   - External documentation links

3. Add breadcrumb navigation
4. Include command execution simulator (visual only)
5. Show real file paths and system calls
```

### Phase 4: Advanced Navigation Features
```markdown
Implement advanced navigation and visualization:

1. Multiple view modes:
   - Tree view (hierarchical)
   - Graph view (network connections)
   - Table view (searchable list)
   - Mind map view (radial)

2. Connection visualization:
   - Show data flow with animated arrows
   - Highlight dependencies
   - Trace system call paths
   - Show impact analysis

3. Navigation features:
   - Mini-map for large tree
   - Keyboard shortcuts (vim-style)
   - Command palette (Ctrl+P)
   - Bookmarks and history
   - Deep linking to nodes

4. Search enhancements:
   - Regex support
   - Filter by type/level/category
   - Search history
   - Saved searches
```

### Phase 5: Learning and Interactive Features
```markdown
Add educational and interactive features:

1. Learning paths:
   - Beginner: Basic Linux navigation
   - Intermediate: System administration
   - Advanced: Kernel development
   - CS Track: Algorithms and data structures

2. Interactive elements:
   - Quiz mode with questions
   - Command practice simulator
   - Scenario-based challenges
   - Progress tracking

3. Content management:
   - Edit mode for updating content
   - Import/export JSON data
   - Version control for changes
   - Community contributions

4. Customization:
   - Theme switcher (light/dark/high-contrast)
   - Font size controls
   - Density settings
   - Color blind modes
```

### Phase 6: Performance and Polish
```markdown
Optimize performance and add final polish:

1. Performance optimization:
   - Lazy loading for large trees
   - Virtual scrolling for lists
   - Web Workers for search
   - RequestAnimationFrame for animations
   - Debounced search input

2. Accessibility:
   - ARIA labels
   - Keyboard navigation
   - Screen reader support
   - Focus management

3. PWA features:
   - Service worker for offline
   - Manifest for installation
   - Local storage for preferences

4. Analytics and feedback:
   - Usage tracking (privacy-friendly)
   - Feedback widget
   - Error reporting
   - Performance monitoring
```

## Complete Content Areas to Cover

### Kernel Components
```
Process Management
├── Scheduler
│   ├── CFS (Completely Fair Scheduler)
│   ├── Real-time schedulers
│   └── Process priorities
├── Process States
├── Threads and Tasks
└── CPU affinity

Memory Management
├── Virtual Memory
├── Page Tables
├── Memory Zones
├── NUMA
└── OOM Killer

I/O Subsystem
├── Block I/O
├── Character devices
├── VFS Layer
└── Page Cache
└── Device Drivers

IPC Mechanisms
├── Pipes and FIFOs
├── Unix Domain Sockets
├── System V IPC
├── POSIX IPC
└── Signals
```

### Networking Stack
```
Network Layers
├── Physical (eth0, wlan0)
├── Data Link (ARP, bridges)
├── Network (IP, routing)
├── Transport (TCP, UDP)
└── Application (sockets)

Network Configuration
├── NetworkManager
├── systemd-networkd
├── netplan
├── ip/ifconfig
└── DNS resolution

Firewall and Security
├── iptables/nftables
├── netfilter framework
├── connection tracking
└── traffic control (tc)
```

### Filesystem Hierarchy
```
Root Filesystem
├── /bin - Essential binaries
├── /boot - Boot loader files
├── /dev - Device files
├── /etc - Configuration
├── /home - User directories
├── /lib - Shared libraries
├── /proc - Process information
├── /sys - Kernel objects
├── /tmp - Temporary files
├── /usr - User programs
└── /var - Variable data

Special Filesystems
├── procfs (/proc)
├── sysfs (/sys)
├── devfs (/dev)
├── tmpfs
└── cgroups
```

### System Services
```
Init System (systemd)
├── Units
│   ├── Service units
│   ├── Target units
│   ├── Timer units
│   └── Mount units
├── Journal logging
├── Process management
└── Boot sequence

Essential Services
├── cron/systemd-timers
├── syslog/journald
├── NetworkManager
├── SSH daemon
└── Package managers
```

### Development Tools
```
Debugging
├── gdb
├── strace
├── ltrace
├── valgrind
└── perf

Monitoring
├── top/htop
├── iostat
├── netstat/ss
├── vmstat
└── systemd-analyze

Build Tools
├── gcc/clang
├── make
├── cmake
├── pkg-config
└── autotools
```

## CS Concepts to Include

### Operating Systems
- Process scheduling algorithms
- Memory management techniques
- Deadlock prevention
- Synchronization primitives
- File system design

### Data Structures
- Kernel linked lists
- Red-black trees
- Hash tables
- Radix trees
- Priority queues

### Algorithms
- Scheduling (O(log n) CFS)
- Page replacement (LRU, Clock)
- Disk scheduling (CFQ, Deadline)
- Network routing (Dijkstra)
- Memory allocation (Buddy system)

### Computer Architecture
- CPU caches
- Virtual memory
- Interrupts and exceptions
- DMA
- Memory barriers

## Testing Checklist

### Functionality
- [ ] All nodes expand/collapse properly
- [ ] Search filters work correctly
- [ ] Information panel displays accurate data
- [ ] Keyboard navigation works
- [ ] Links between nodes function
- [ ] Copy buttons work
- [ ] Theme switching works

### Performance
- [ ] Loads in under 2 seconds
- [ ] Smooth animations (60fps)
- [ ] Search responds instantly
- [ ] No memory leaks
- [ ] Works with 1000+ nodes

### Compatibility
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile responsive
- [ ] Tablet layout
- [ ] Keyboard only navigation
- [ ] Screen reader compatible

### Content
- [ ] Technically accurate
- [ ] Commands tested
- [ ] Paths verified
- [ ] Links work
- [ ] No typos
- [ ] Consistent formatting

## Deployment Configuration

### vercel.json
```json
{
  "version": 2,
  "public": true,
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=31536000, immutable"
        }
      ]
    }
  ]
}
```

## Version Control Strategy

### Commit Messages
```
feat: Add networking stack visualization
fix: Correct process state transitions
docs: Update README with usage examples
style: Improve mobile responsive layout
perf: Optimize tree rendering with virtual scroll
refactor: Extract data structure to JSON files
```

### Branching
- `main` - Production (auto-deploys to Vercel)
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes

## Resources and References

### Documentation
- [Linux Kernel Documentation](https://www.kernel.org/doc/)
- [systemd Documentation](https://systemd.io/)
- [POSIX Specifications](https://pubs.opengroup.org/onlinepubs/9699919799/)

### Books
- "Understanding the Linux Kernel" - Bovet & Cesati
- "Linux System Programming" - Robert Love
- "The Linux Programming Interface" - Michael Kerrisk

### Tools
- Claude Code for implementation
- VS Code for development
- Chrome DevTools for debugging
- Lighthouse for performance

## Success Metrics

1. **Load Time**: < 2 seconds
2. **Search Speed**: < 100ms
3. **Node Count**: > 500 comprehensive nodes
4. **User Engagement**: > 5 min average session
5. **Learning Paths**: 10+ complete paths
6. **Mobile Usage**: 30%+ mobile friendly
7. **Accessibility**: WCAG 2.1 AA compliant

## Next Steps

1. Start with Phase 1 using Claude Code
2. Test locally with Live Server
3. Push to GitHub
4. Deploy to Vercel
5. Iterate based on feedback
6. Add more content progressively
7. Enable community contributions

---

*This guide is designed for iterative development with Claude Code. Each phase builds upon the previous one, creating a progressively more sophisticated Linux system map.*