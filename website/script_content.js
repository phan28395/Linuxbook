        // Performance monitoring
        const performanceObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'measure') {
                    console.log(`Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
                }
            }
        });
        performanceObserver.observe({ entryTypes: ['measure'] });
        
        // Register Service Worker for PWA support
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful');
                        
                        // Check for updates periodically
                        setInterval(() => {
                            registration.update();
                        }, 3600000); // Check every hour
                    })
                    .catch(err => {
                        console.log('ServiceWorker registration failed:', err);
                    });
            });
            
            // Handle app install prompt
            let deferredPrompt;
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                // Show install button or banner
                const installBtn = document.createElement('button');
                installBtn.textContent = '📥 Install App';
                installBtn.className = 'view-btn';
                installBtn.onclick = async () => {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        console.log(`User ${outcome} the install prompt`);
                        deferredPrompt = null;
                        installBtn.remove();
                    }
                };
                document.querySelector('.header').appendChild(installBtn);
            });
        }
        
        // Initialize Web Worker for search
        let searchWorker = null;
        if (window.Worker) {
            searchWorker = new Worker('/search-worker.js');
            searchWorker.addEventListener('message', (event) => {
                const { type, data } = event.data;
                if (type === 'SEARCH_RESULTS') {
                    handleSearchResults(data.results);
                    performance.measure('search-complete', 'search-start');
                } else if (type === 'INIT_COMPLETE') {
                    console.log(`Search index built with ${data.indexSize} entries`);
                }
            });
        }
        
        // Debounce function for search input
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
        
        // Initialize with loading state
        let linuxSystemData = null;
        let selectedNode = null;
        let currentNodeData = null;
        let searchTerm = '';
        let currentView = 'tree';
        let bookmarks = JSON.parse(localStorage.getItem('linuxMapBookmarks') || '[]');
        let history = JSON.parse(localStorage.getItem('linuxMapHistory') || '[]');
        let allNodes = [];
        let focusedNodeIndex = 0;
        let learningData = null;
        let userProgress = JSON.parse(localStorage.getItem('linuxMapProgress') || JSON.stringify({
            nodesVisited: [],
            quizzesCompleted: [],
            challengesSolved: [],
            achievements: [],
            currentPath: null,
            scores: {}
        }));
        let currentQuiz = null;
        let quizScore = 0;
        
        const tooltip = document.getElementById('tooltip');

        // Load JSON data files
        async function loadSystemData() {
            try {
                // Show loading state
                const treeRoot = document.getElementById('tree-root');
                treeRoot.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';

                // Load all JSON files in parallel
                const [kernelData, networkData, filesystemData, servicesData, learning] = await Promise.all([
                    fetch('data/kernel.json').then(r => r.json()),
                    fetch('data/network.json').then(r => r.json()),
                    fetch('data/filesystem.json').then(r => r.json()),
                    fetch('data/services.json').then(r => r.json()),
                    fetch('data/learning.json').then(r => r.json()).catch(() => null)
                ]);
                
                learningData = learning;

                // Merge data into root structure
                linuxSystemData = {
                    name: "Linux System",
                    type: "root",
                    children: [
                        kernelData,
                        createUserSpaceNode(), // Still use hardcoded for userspace as it's simpler
                        filesystemData,
                        networkData,
                        servicesData
                    ]
                };

                // Initialize search worker with data
                if (searchWorker) {
                    searchWorker.postMessage({
                        type: 'INIT',
                        data: { nodes: linuxSystemData.children }
                    });
                }
                
                // Clear loading and build tree
                treeRoot.innerHTML = '';
                linuxSystemData.children.forEach(child => {
                    treeRoot.appendChild(createTreeNode(child));
                });

            } catch (error) {
                console.error('Error loading system data:', error);
                // Fallback to embedded data
                loadEmbeddedData();
            }
        }

        // Create userspace node (keeping this embedded as it's relatively small)
        function createUserSpaceNode() {
            return {
                id: "userspace",
                name: "User Space",
                type: "userspace",
                level: "beginner",
                description: "Programs and libraries that run outside the kernel with restricted privileges.",
                children: [
                    {
                        name: "Shell",
                        type: "userspace",
                        description: "Command-line interface for interacting with the system (bash, zsh, fish).",
                        commands: [
                            { cmd: "echo $SHELL", desc: "Show current shell" },
                            { cmd: "chsh -s /bin/zsh", desc: "Change default shell" }
                        ],
                        files: ["~/.bashrc", "~/.zshrc", "/etc/shells"],
                        children: [
                                {
                                    name: "Scheduler (CFS)",
                                    type: "kernel",
                                    description: "Completely Fair Scheduler - O(log n) scheduling algorithm using red-black trees.",
                                    files: ["/proc/sched_debug", "/sys/kernel/debug/sched_features"]
                                },
                                {
                                    name: "Process States",
                                    type: "kernel",
                                    description: "Running, Sleeping, Stopped, Zombie states and transitions.",
                                    commands: [
                                        { cmd: "ps aux | grep Z", desc: "Find zombie processes" }
                                    ]
                                },
                                {
                                    name: "CPU Affinity",
                                    type: "kernel",
                                    description: "Binding processes to specific CPU cores for performance optimization.",
                                    commands: [
                                        { cmd: "taskset -c 0,1 command", desc: "Run on cores 0 and 1" },
                                        { cmd: "taskset -p pid", desc: "Check process affinity" }
                                    ]
                                }
                            ]
                        },
                        {
                            name: "Memory Management",
                            type: "kernel",
                            description: "Virtual memory system, page tables, memory allocation, and swapping.",
                            commands: [
                                { cmd: "free -h", desc: "Display memory usage" },
                                { cmd: "vmstat 1", desc: "Virtual memory statistics" },
                                { cmd: "cat /proc/meminfo", desc: "Detailed memory information" }
                            ],
                            files: ["/proc/meminfo", "/proc/vmstat", "/proc/sys/vm/"],
                            children: [
                                {
                                    name: "Virtual Memory",
                                    type: "kernel",
                                    description: "Address space isolation and memory protection through page tables.",
                                    files: ["/proc/*/maps", "/proc/*/smaps"]
                                },
                                {
                                    name: "Page Cache",
                                    type: "kernel",
                                    description: "Caches file data in RAM for faster access.",
                                    commands: [
                                        { cmd: "echo 3 > /proc/sys/vm/drop_caches", desc: "Clear page cache" }
                                    ]
                                },
                                {
                                    name: "OOM Killer",
                                    type: "kernel",
                                    description: "Out of Memory killer - terminates processes when system runs out of memory.",
                                    files: ["/proc/sys/vm/oom_kill_allocating_task", "/proc/*/oom_score"]
                                }
                            ]
                        },
                        {
                            name: "I/O Subsystem",
                            type: "kernel",
                            description: "Manages input/output operations, device drivers, and filesystem access.",
                            commands: [
                                { cmd: "iostat -x 1", desc: "I/O statistics" },
                                { cmd: "iotop", desc: "I/O usage by process" }
                            ],
                            children: [
                                {
                                    name: "Block Layer",
                                    type: "kernel",
                                    description: "Manages block devices like hard drives and SSDs.",
                                    files: ["/sys/block/", "/proc/diskstats"]
                                },
                                {
                                    name: "VFS Layer",
                                    type: "kernel",
                                    description: "Virtual File System - abstraction layer for different filesystems.",
                                    files: ["/proc/filesystems", "/proc/mounts"]
                                },
                                {
                                    name: "Device Drivers",
                                    type: "kernel",
                                    description: "Kernel modules that interface with hardware devices.",
                                    commands: [
                                        { cmd: "lsmod", desc: "List loaded kernel modules" },
                                        { cmd: "modprobe module_name", desc: "Load kernel module" }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    name: "User Space",
                    type: "userspace",
                    description: "Programs and libraries that run outside the kernel with restricted privileges.",
                    children: [
                        {
                            name: "Shell",
                            type: "userspace",
                            description: "Command-line interface for interacting with the system (bash, zsh, fish).",
                            commands: [
                                { cmd: "echo $SHELL", desc: "Show current shell" },
                                { cmd: "chsh -s /bin/zsh", desc: "Change default shell" }
                            ],
                            files: ["~/.bashrc", "~/.zshrc", "/etc/shells"],
                            children: [
                                {
                                    name: "Bash",
                                    type: "userspace",
                                    description: "Bourne Again Shell - the default shell on most Linux distributions.",
                                    files: ["~/.bashrc", "~/.bash_profile", "/etc/bash.bashrc"]
                                },
                                {
                                    name: "Environment Variables",
                                    type: "userspace",
                                    description: "System and user variables that affect program behavior.",
                                    commands: [
                                        { cmd: "env", desc: "List all environment variables" },
                                        { cmd: "export VAR=value", desc: "Set environment variable" }
                                    ]
                                },
                                {
                                    name: "Job Control",
                                    type: "userspace",
                                    description: "Managing foreground and background processes.",
                                    commands: [
                                        { cmd: "jobs", desc: "List background jobs" },
                                        { cmd: "fg %1", desc: "Bring job to foreground" },
                                        { cmd: "bg %1", desc: "Send job to background" }
                                    ]
                                }
                            ]
                        },
                        {
                            name: "System Libraries",
                            type: "userspace",
                            description: "Shared libraries that provide common functionality to programs.",
                            files: ["/lib/", "/usr/lib/", "/etc/ld.so.conf"],
                            children: [
                                {
                                    name: "glibc",
                                    type: "userspace",
                                    description: "GNU C Library - the core C library providing system call wrappers.",
                                    commands: [
                                        { cmd: "ldd /bin/ls", desc: "Show library dependencies" }
                                    ]
                                },
                                {
                                    name: "Dynamic Linker",
                                    type: "userspace",
                                    description: "ld.so - loads shared libraries at runtime.",
                                    files: ["/etc/ld.so.cache", "/etc/ld.so.conf.d/"]
                                },
                                {
                                    name: "System Calls",
                                    type: "userspace",
                                    description: "Interface between user programs and kernel services.",
                                    commands: [
                                        { cmd: "strace ls", desc: "Trace system calls" }
                                    ]
                                }
                            ]
                        },
                        {
                            name: "Applications",
                            type: "userspace",
                            description: "User programs and utilities that perform specific tasks.",
                            children: [
                                {
                                    name: "Core Utilities",
                                    type: "userspace",
                                    description: "Essential command-line tools (ls, cp, mv, rm, etc.).",
                                    files: ["/usr/bin/", "/bin/"]
                                },
                                {
                                    name: "Package Managers",
                                    type: "userspace",
                                    description: "Tools for installing and managing software (apt, yum, dnf, pacman).",
                                    commands: [
                                        { cmd: "apt update && apt upgrade", desc: "Update packages (Debian/Ubuntu)" },
                                        { cmd: "yum update", desc: "Update packages (RHEL/CentOS)" }
                                    ]
                                },
                                {
                                    name: "Development Tools",
                                    type: "userspace",
                                    description: "Compilers, debuggers, and build tools.",
                                    commands: [
                                        { cmd: "gcc -o program program.c", desc: "Compile C program" },
                                        { cmd: "gdb ./program", desc: "Debug program" }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    name: "Filesystem",
                    type: "filesystem",
                    description: "Hierarchical file organization following the Filesystem Hierarchy Standard (FHS).",
                    children: [
                        {
                            name: "/bin",
                            type: "filesystem",
                            description: "Essential command binaries needed in single-user mode.",
                            files: ["/bin/ls", "/bin/cp", "/bin/bash"]
                        },
                        {
                            name: "/etc",
                            type: "filesystem",
                            description: "System configuration files and directories.",
                            files: ["/etc/passwd", "/etc/fstab", "/etc/hosts"],
                            children: [
                                {
                                    name: "/etc/systemd",
                                    type: "filesystem",
                                    description: "systemd configuration and unit files.",
                                    files: ["/etc/systemd/system/", "/etc/systemd/user/"]
                                },
                                {
                                    name: "/etc/network",
                                    type: "filesystem",
                                    description: "Network configuration files.",
                                    files: ["/etc/network/interfaces", "/etc/resolv.conf"]
                                }
                            ]
                        },
                        {
                            name: "/proc",
                            type: "filesystem",
                            description: "Virtual filesystem providing process and kernel information.",
                            files: ["/proc/cpuinfo", "/proc/meminfo", "/proc/version"],
                            children: [
                                {
                                    name: "/proc/sys",
                                    type: "filesystem",
                                    description: "Kernel tunable parameters.",
                                    commands: [
                                        { cmd: "sysctl -a", desc: "List all kernel parameters" }
                                    ]
                                },
                                {
                                    name: "/proc/[pid]",
                                    type: "filesystem",
                                    description: "Per-process information directories.",
                                    files: ["/proc/[pid]/status", "/proc/[pid]/cmdline", "/proc/[pid]/fd/"]
                                }
                            ]
                        },
                        {
                            name: "/sys",
                            type: "filesystem",
                            description: "Virtual filesystem exposing kernel objects and their attributes.",
                            files: ["/sys/class/", "/sys/devices/", "/sys/kernel/"],
                            children: [
                                {
                                    name: "/sys/class",
                                    type: "filesystem",
                                    description: "Device classes organized by type.",
                                    files: ["/sys/class/net/", "/sys/class/block/"]
                                },
                                {
                                    name: "/sys/devices",
                                    type: "filesystem",
                                    description: "Device hierarchy as seen by the kernel.",
                                    files: ["/sys/devices/system/cpu/"]
                                }
                            ]
                        },
                        {
                            name: "/dev",
                            type: "filesystem",
                            description: "Device files for hardware and virtual devices.",
                            files: ["/dev/sda", "/dev/null", "/dev/random"],
                            children: [
                                {
                                    name: "Block Devices",
                                    type: "filesystem",
                                    description: "Devices that transfer data in blocks (disks, partitions).",
                                    files: ["/dev/sda1", "/dev/nvme0n1"]
                                },
                                {
                                    name: "Character Devices",
                                    type: "filesystem",
                                    description: "Devices that transfer data character by character.",
                                    files: ["/dev/tty", "/dev/console", "/dev/urandom"]
                                }
                            ]
                        }
                    ]
                },
                {
                    name: "Networking",
                    type: "network",
                    description: "TCP/IP stack implementation and network configuration.",
                    commands: [
                        { cmd: "ip addr show", desc: "Show network interfaces" },
                        { cmd: "ss -tuln", desc: "Show listening ports" },
                        { cmd: "netstat -rn", desc: "Show routing table" }
                    ],
                    children: [
                        {
                            name: "TCP/IP Stack",
                            type: "network",
                            description: "Implementation of the Internet protocol suite.",
                            children: [
                                {
                                    name: "Network Layer (IP)",
                                    type: "network",
                                    description: "Internet Protocol - routing and addressing.",
                                    commands: [
                                        { cmd: "ip route show", desc: "Display routing table" }
                                    ]
                                },
                                {
                                    name: "Transport Layer",
                                    type: "network",
                                    description: "TCP and UDP protocols for reliable and unreliable data transfer.",
                                    commands: [
                                        { cmd: "ss -tan", desc: "Show TCP connections" },
                                        { cmd: "ss -uan", desc: "Show UDP connections" }
                                    ]
                                },
                                {
                                    name: "Application Layer",
                                    type: "network",
                                    description: "Sockets API for network programming.",
                                    files: ["/proc/net/tcp", "/proc/net/udp"]
                                }
                            ]
                        },
                        {
                            name: "Network Interfaces",
                            type: "network",
                            description: "Physical and virtual network adapters.",
                            commands: [
                                { cmd: "ip link show", desc: "List network interfaces" },
                                { cmd: "ethtool eth0", desc: "Show interface details" }
                            ],
                            children: [
                                {
                                    name: "Physical Interfaces",
                                    type: "network",
                                    description: "Ethernet, WiFi, and other hardware interfaces.",
                                    files: ["/sys/class/net/eth0/", "/sys/class/net/wlan0/"]
                                },
                                {
                                    name: "Virtual Interfaces",
                                    type: "network",
                                    description: "Bridges, VLANs, tunnels, and other virtual adapters.",
                                    commands: [
                                        { cmd: "ip link add br0 type bridge", desc: "Create bridge" }
                                    ]
                                }
                            ]
                        },
                        {
                            name: "Firewall (iptables/nftables)",
                            type: "network",
                            description: "Packet filtering and network address translation.",
                            commands: [
                                { cmd: "iptables -L -n", desc: "List firewall rules" },
                                { cmd: "nft list ruleset", desc: "List nftables rules" }
                            ],
                            children: [
                                {
                                    name: "Netfilter Framework",
                                    type: "network",
                                    description: "Kernel framework for packet filtering and manipulation.",
                                    files: ["/proc/net/netfilter/"]
                                },
                                {
                                    name: "Connection Tracking",
                                    type: "network",
                                    description: "Stateful firewall capabilities.",
                                    files: ["/proc/net/nf_conntrack"],
                                    commands: [
                                        { cmd: "conntrack -L", desc: "List tracked connections" }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    name: "System Services",
                    type: "service",
                    description: "Background processes and daemons that provide system functionality.",
                    children: [
                        {
                            name: "systemd",
                            type: "service",
                            description: "System and service manager - the init system for most modern distributions.",
                            commands: [
                                { cmd: "systemctl status", desc: "System status overview" },
                                { cmd: "systemctl list-units", desc: "List all units" },
                                { cmd: "journalctl -xe", desc: "View system logs" }
                            ],
                            files: ["/etc/systemd/", "/lib/systemd/"],
                            children: [
                                {
                                    name: "Unit Files",
                                    type: "service",
                                    description: "Service, target, timer, and mount unit definitions.",
                                    files: ["/etc/systemd/system/", "/lib/systemd/system/"],
                                    commands: [
                                        { cmd: "systemctl cat sshd.service", desc: "View unit file" }
                                    ]
                                },
                                {
                                    name: "Targets",
                                    type: "service",
                                    description: "Groupings of units for synchronization points.",
                                    commands: [
                                        { cmd: "systemctl get-default", desc: "Show default target" },
                                        { cmd: "systemctl isolate multi-user.target", desc: "Switch target" }
                                    ]
                                },
                                {
                                    name: "Journal",
                                    type: "service",
                                    description: "Centralized logging system.",
                                    commands: [
                                        { cmd: "journalctl -u sshd", desc: "View service logs" },
                                        { cmd: "journalctl --since today", desc: "Today's logs" }
                                    ],
                                    files: ["/var/log/journal/"]
                                }
                            ]
                        },
                        {
                            name: "Cron",
                            type: "service",
                            description: "Time-based job scheduler for periodic tasks.",
                            commands: [
                                { cmd: "crontab -l", desc: "List user cron jobs" },
                                { cmd: "crontab -e", desc: "Edit cron jobs" }
                            ],
                            files: ["/etc/crontab", "/etc/cron.d/", "/var/spool/cron/"],
                            children: [
                                {
                                    name: "System Cron",
                                    type: "service",
                                    description: "System-wide scheduled tasks.",
                                    files: ["/etc/cron.daily/", "/etc/cron.weekly/", "/etc/cron.monthly/"]
                                },
                                {
                                    name: "User Crontabs",
                                    type: "service",
                                    description: "Per-user scheduled tasks.",
                                    files: ["/var/spool/cron/crontabs/"]
                                }
                            ]
                        },
                        {
                            name: "SSH Daemon",
                            type: "service",
                            description: "Secure Shell server for remote access.",
                            commands: [
                                { cmd: "systemctl status sshd", desc: "Check SSH service" },
                                { cmd: "ss -tlnp | grep :22", desc: "Check if SSH is listening" }
                            ],
                            files: ["/etc/ssh/sshd_config", "/etc/ssh/ssh_host_*_key"],
                            children: [
                                {
                                    name: "Authentication",
                                    type: "service",
                                    description: "Key-based and password authentication mechanisms.",
                                    files: ["~/.ssh/authorized_keys", "/etc/ssh/sshd_config"]
                                },
                                {
                                    name: "SSH Keys",
                                    type: "service",
                                    description: "Public/private key pairs for secure authentication.",
                                    commands: [
                                        { cmd: "ssh-keygen -t ed25519", desc: "Generate SSH key" }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
            };
        }

        // Fallback: Load embedded minimal data if JSON fails
        function loadEmbeddedData() {
            const treeRoot = document.getElementById('tree-root');
            treeRoot.innerHTML = '';
            
            // Minimal embedded data structure
            linuxSystemData = {
                name: "Linux System",
                type: "root",
                children: [
                    {
                        name: "Kernel Space",
                        type: "kernel",
                        description: "The core of the Linux operating system.",
                        children: [
                            { name: "Process Management", type: "kernel", description: "Manages processes and scheduling." },
                            { name: "Memory Management", type: "kernel", description: "Virtual memory and allocation." },
                            { name: "I/O Subsystem", type: "kernel", description: "Input/output and device drivers." }
                        ]
                    },
                    createUserSpaceNode(),
                    {
                        name: "Filesystem",
                        type: "filesystem",
                        description: "Linux filesystem hierarchy.",
                        children: [
                            { name: "/bin", type: "filesystem", description: "Essential command binaries." },
                            { name: "/etc", type: "filesystem", description: "System configuration files." },
                            { name: "/home", type: "filesystem", description: "User home directories." }
                        ]
                    },
                    {
                        name: "Networking",
                        type: "network",
                        description: "TCP/IP networking stack.",
                        children: [
                            { name: "TCP/IP Stack", type: "network", description: "Network protocol layers." },
                            { name: "Network Interfaces", type: "network", description: "Network adapters and configuration." }
                        ]
                    },
                    {
                        name: "System Services",
                        type: "service",
                        description: "System daemons and services.",
                        children: [
                            { name: "systemd", type: "service", description: "System and service manager." },
                            { name: "SSH", type: "service", description: "Secure shell service." }
                        ]
                    }
                ]
            };
            
            // Build tree with embedded data
            linuxSystemData.children.forEach(child => {
                treeRoot.appendChild(createTreeNode(child));
            });
        }

        // Handle search results from Web Worker
        function handleSearchResults(results) {
            const allNodes = document.querySelectorAll('.tree-node');
            const matchedIds = new Set(results.map(r => r.node.id));
            
            allNodes.forEach(node => {
                const nodeId = node.dataset.nodeId;
                if (results.length === 0 || matchedIds.has(nodeId)) {
                    node.style.display = '';
                    node.style.opacity = '1';
                    
                    // Expand parent nodes if child matches
                    let parent = node.parentElement;
                    while (parent && parent.classList.contains('tree-children')) {
                        parent.classList.add('expanded');
                        const parentIcon = parent.previousElementSibling?.querySelector('.tree-node-icon');
                        if (parentIcon) {
                            parentIcon.classList.add('expanded');
                        }
                        parent = parent.parentElement?.parentElement;
                    }
                } else {
                    node.style.display = 'none';
                }
            });
            
            // Update table view if active
            if (currentView === 'table') {
                updateTableView(results.map(r => r.node));
            }
        }
        
        // Create tree node element with lazy loading support
        function createTreeNode(data, level = 0) {
            const li = document.createElement('li');
            li.className = 'tree-node';
            li.dataset.nodeId = data.id || data.name;
            
            const content = document.createElement('div');
            content.className = `tree-node-content node-${data.type || 'default'}`;
            
            // Add expand/collapse icon if node has children
            if (data.children && data.children.length > 0) {
                const icon = document.createElement('span');
                icon.className = 'tree-node-icon';
                icon.innerHTML = '▶';
                content.appendChild(icon);
            } else {
                const spacer = document.createElement('span');
                spacer.style.width = '30px';
                spacer.style.display = 'inline-block';
                content.appendChild(spacer);
            }
            
            // Add node label
            const label = document.createElement('span');
            label.className = 'tree-node-label';
            label.textContent = data.name;
            content.appendChild(label);
            
            // Add type badge
            if (data.type && data.type !== 'root') {
                const badge = document.createElement('span');
                badge.className = 'tree-node-badge';
                badge.textContent = data.type;
                content.appendChild(badge);
            }
            
            // Add click handler
            content.addEventListener('click', (e) => {
                e.stopPropagation();
                handleNodeClick(content, data);
            });
            
            // Add hover tooltip
            if (data.description) {
                content.addEventListener('mouseenter', (e) => {
                    showTooltip(e, data.description);
                });
                content.addEventListener('mouseleave', hideTooltip);
            }
            
            li.appendChild(content);
            
            // Add children container
            if (data.children && data.children.length > 0) {
                const childrenUl = document.createElement('ul');
                childrenUl.className = 'tree-children';
                data.children.forEach(child => {
                    childrenUl.appendChild(createTreeNode(child, level + 1));
                });
                li.appendChild(childrenUl);
            }
            
            return li;
        }

        // Handle node click
        function handleNodeClick(element, data) {
            // Toggle expansion
            const icon = element.querySelector('.tree-node-icon');
            const children = element.parentElement.querySelector('.tree-children');
            
            if (children) {
                children.classList.toggle('expanded');
                if (icon) {
                    icon.classList.toggle('expanded');
                }
            }
            
            // Update selection
            if (selectedNode) {
                selectedNode.classList.remove('selected');
            }
            element.classList.add('selected');
            selectedNode = element;
            
            // Update info panel
            updateInfoPanel(data);
        }

        // Build breadcrumb path
        function buildBreadcrumb(node, path = []) {
            path.unshift(node.name);
            // Could traverse up the tree if we track parents
            const breadcrumb = document.getElementById('breadcrumb');
            breadcrumb.innerHTML = '<span class="breadcrumb-item">Linux System</span>';
            path.forEach((item, index) => {
                const span = document.createElement('span');
                span.className = 'breadcrumb-item';
                span.textContent = item;
                breadcrumb.appendChild(span);
            });
        }

        // Update info panel with node details
        function updateInfoPanel(data) {
            const panel = document.getElementById('info-panel');
            panel.classList.add('active');
            
            // Update title and breadcrumb
            document.getElementById('info-title').textContent = data.name;
            buildBreadcrumb(data);
            
            // Reset tabs to Overview
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            document.querySelector('[data-tab="overview"]').classList.add('active');
            document.getElementById('overview-tab').classList.add('active');
            
            // Update Overview Tab
            const description = data.description || 
                               (data.metadata && data.metadata.description) || 
                               'No description available.';
            document.getElementById('info-description').textContent = description;
            
            // Update Metadata Section
            updateMetadataSection(data);
            
            // Update Connections Section
            updateConnectionsSection(data);
            
            // Update Commands Tab
            updateCommandsTab(data);
            
            // Update Files Tab
            updateFilesTab(data);
            
            // Update CS Theory Tab
            updateTheoryTab(data);
            
            // Update Performance Tab
            updatePerformanceTab(data);
            
            // Update Examples Tab
            updateExamplesTab(data);
        }
        
        // Update metadata section
        function updateMetadataSection(data) {
            const section = document.getElementById('metadata-section');
            const content = document.getElementById('metadata-content');
            
            if (data.metadata) {
                section.style.display = 'block';
                content.innerHTML = '';
                
                if (data.metadata.path) {
                    content.innerHTML += `<div class="metric-card">
                        <div class="metric-label">Path</div>
                        <div class="metric-value">${data.metadata.path}</div>
                    </div>`;
                }
                if (data.metadata.created_by) {
                    content.innerHTML += `<div class="metric-card">
                        <div class="metric-label">Created By</div>
                        <div class="metric-value">${data.metadata.created_by}</div>
                    </div>`;
                }
                if (data.metadata.managed_by) {
                    content.innerHTML += `<div class="metric-card">
                        <div class="metric-label">Managed By</div>
                        <div class="metric-value">${data.metadata.managed_by}</div>
                    </div>`;
                }
            } else {
                section.style.display = 'none';
            }
        }
        
        // Update connections section
        function updateConnectionsSection(data) {
            const section = document.getElementById('connections-section');
            const content = document.getElementById('connections-list');
            
            if (data.connections) {
                section.style.display = 'block';
                content.innerHTML = '';
                
                ['reads_from', 'writes_to', 'controls', 'controlled_by'].forEach(type => {
                    if (data.connections[type] && data.connections[type].length > 0) {
                        const label = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                        content.innerHTML += `
                            <div class="metric-card">
                                <div class="metric-label">${label}</div>
                                <div class="metric-value">${data.connections[type].join(', ')}</div>
                            </div>`;
                    }
                });
            } else {
                section.style.display = 'none';
            }
        }
        
        // Update commands tab
        function updateCommandsTab(data) {
            const commandsList = document.getElementById('commands-list');
            commandsList.innerHTML = '';
            
            const commands = data.commands || 
                           (data.operations && data.operations.commands) || 
                           [];
            
            if (commands.length > 0) {
                commands.forEach(cmd => {
                    const block = document.createElement('div');
                    block.className = 'command-block';
                    const cmdText = cmd.cmd || cmd.command;
                    const cmdDesc = cmd.desc || cmd.description || '';
                    const example = cmd.example || '';
                    block.innerHTML = `
                        <code>${cmdText}</code>
                        <button class="copy-btn" onclick="copyToClipboard('${cmdText.replace(/'/g, "\\'")}'); simulateCommand('${cmdText.replace(/'/g, "\\'")}')">Copy & Try</button>
                        ${cmdDesc ? `<div style="color: var(--text-secondary); margin-top: 5px; font-size: 12px;">${cmdDesc}</div>` : ''}
                        ${example ? `<div style="color: #667eea; margin-top: 3px; font-size: 11px;">Example output: ${example}</div>` : ''}
                    `;
                    commandsList.appendChild(block);
                });
                
                // Show command simulator
                document.getElementById('command-simulator').style.display = 'block';
            } else {
                commandsList.innerHTML = '<p style="color: var(--text-secondary);">No commands available for this node.</p>';
                document.getElementById('command-simulator').style.display = 'none';
            }
        }
        
        // Update files tab
        function updateFilesTab(data) {
            const configFilesList = document.getElementById('config-files-list');
            const systemFilesList = document.getElementById('system-files-list');
            
            configFilesList.innerHTML = '';
            systemFilesList.innerHTML = '';
            
            // Config files from operations
            const configFiles = (data.operations && data.operations.config_files) || [];
            if (configFiles.length > 0) {
                configFiles.forEach(file => {
                    const item = document.createElement('div');
                    item.className = 'metric-card';
                    item.innerHTML = `
                        <div class="metric-label">${file.path}</div>
