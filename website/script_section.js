    <script>
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
                        <div style="font-size: 12px; color: var(--text-secondary);">
                            Format: ${file.format} | Editable: ${file.editable ? 'Yes' : 'No'}
                        </div>
                    `;
                    configFilesList.appendChild(item);
                });
            } else {
                configFilesList.innerHTML = '<p style="color: var(--text-secondary);">No configuration files.</p>';
            }
            
            // System files
            const files = data.files || [];
            if (files.length > 0) {
                files.forEach(file => {
                    const item = document.createElement('div');
                    item.style.padding = '5px 0';
                    item.style.fontFamily = 'monospace';
                    item.style.color = 'var(--text-secondary)';
                    item.textContent = file;
                    systemFilesList.appendChild(item);
                });
            } else {
                systemFilesList.innerHTML = '<p style="color: var(--text-secondary);">No system files.</p>';
            }
        }
        
        // Update CS Theory tab
        function updateTheoryTab(data) {
            const conceptsContent = document.getElementById('cs-concepts-content');
            const algorithmsSection = document.getElementById('algorithms-section');
            const algorithmsContent = document.getElementById('algorithms-content');
            
            conceptsContent.innerHTML = '';
            algorithmsContent.innerHTML = '';
            
            if (data.cs_concepts) {
                // Categories and topics
                if (data.cs_concepts.category) {
                    conceptsContent.innerHTML += `
                        <div class="metric-card">
                            <div class="metric-label">Categories</div>
                            <div class="metric-value">${data.cs_concepts.category.join(', ')}</div>
                        </div>`;
                }
                
                if (data.cs_concepts.topics) {
                    conceptsContent.innerHTML += `
                        <div class="metric-card">
                            <div class="metric-label">Topics</div>
                            <div class="metric-value">${data.cs_concepts.topics.join(', ')}</div>
                        </div>`;
                }
                
                if (data.cs_concepts.difficulty) {
                    const difficultyColor = {
                        'beginner': '#2ecc71',
                        'intermediate': '#f39c12',
                        'advanced': '#e74c3c'
                    }[data.cs_concepts.difficulty] || '#667eea';
                    
                    conceptsContent.innerHTML += `
                        <div class="metric-card">
                            <div class="metric-label">Difficulty</div>
                            <div class="metric-value" style="color: ${difficultyColor};">${data.cs_concepts.difficulty.toUpperCase()}</div>
                        </div>`;
                }
                
                // Show algorithms section if there are complexity metrics
                if (data.performance && data.performance.metrics) {
                    algorithmsSection.style.display = 'block';
                    Object.entries(data.performance.metrics).forEach(([key, value]) => {
                        if (value.includes('O(')) {
                            algorithmsContent.innerHTML += `
                                <div class="metric-card">
                                    <div class="metric-label">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                                    <div class="metric-value" style="font-family: monospace;">${value}</div>
                                </div>`;
                        }
                    });
                } else {
                    algorithmsSection.style.display = 'none';
                }
            } else {
                conceptsContent.innerHTML = '<p style="color: var(--text-secondary);">No CS concepts available for this node.</p>';
                algorithmsSection.style.display = 'none';
            }
        }
        
        // Update Performance tab
        function updatePerformanceTab(data) {
            const metricsContent = document.getElementById('metrics-content');
            const tuningSection = document.getElementById('tuning-section');
            const tuningContent = document.getElementById('tuning-content');
            
            metricsContent.innerHTML = '';
            tuningContent.innerHTML = '';
            
            if (data.performance) {
                // Metrics
                if (data.performance.metrics) {
                    Object.entries(data.performance.metrics).forEach(([key, value]) => {
                        metricsContent.innerHTML += `
                            <div class="metric-card">
                                <div class="metric-label">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                                <div class="metric-value">${value}</div>
                            </div>`;
                    });
                }
                
                // Bottlenecks
                if (data.performance.bottlenecks) {
                    metricsContent.innerHTML += `
                        <div class="metric-card">
                            <div class="metric-label">Common Bottlenecks</div>
                            <div class="metric-value">${data.performance.bottlenecks.join(', ')}</div>
                        </div>`;
                }
                
                // Tuning parameters
                if (data.performance.tuning) {
                    tuningSection.style.display = 'block';
                    data.performance.tuning.forEach(param => {
                        tuningContent.innerHTML += `
                            <div class="metric-card">
                                <div class="metric-value" style="font-family: monospace;">${param}</div>
                            </div>`;
                    });
                } else {
                    tuningSection.style.display = 'none';
                }
            } else {
                metricsContent.innerHTML = '<p style="color: var(--text-secondary);">No performance metrics available for this node.</p>';
                tuningSection.style.display = 'none';
            }
        }
        
        // Update Examples tab
        function updateExamplesTab(data) {
            const examplesContent = document.getElementById('examples-content');
            examplesContent.innerHTML = '';
            
            const examples = data.examples || [];
            
            if (examples.length > 0) {
                examples.forEach(example => {
                    const card = document.createElement('div');
                    card.className = 'example-card';
                    card.innerHTML = `
                        <div class="example-title">${example.title}</div>
                        <div class="example-code">${highlightCode(example.code)}</div>
                        <div class="example-explanation">${example.explanation}</div>
                    `;
                    examplesContent.appendChild(card);
                });
            } else {
                examplesContent.innerHTML = '<p style="color: var(--text-secondary);">No examples available for this node.</p>';
            }
        }
        
        // Simple syntax highlighting
        function highlightCode(code) {
            return code
                .replace(/\b(sudo|apt|yum|dnf|systemctl|docker|git|npm|pip)\b/g, '<span class="code-keyword">$1</span>')
                .replace(/(['"])([^'"]*)\1/g, '<span class="code-string">$1$2$1</span>')
                .replace(/(#.*)$/gm, '<span class="code-comment">$1</span>')
                .replace(/\b(\d+)\b/g, '<span class="code-number">$1</span>');
        }
        
        // Simulate command execution (visual only)
        function simulateCommand(cmd) {
            const terminalCmd = document.getElementById('terminal-command');
            const terminalOutput = document.getElementById('terminal-output');
            
            // Clear previous output
            terminalOutput.innerHTML = '';
            
            // Type command with animation
            let i = 0;
            terminalCmd.textContent = '';
            const typeInterval = setInterval(() => {
                if (i < cmd.length) {
                    terminalCmd.textContent += cmd[i];
                    i++;
                } else {
                    clearInterval(typeInterval);
                    // Show simulated output after typing
                    setTimeout(() => {
                        const outputLine = document.createElement('div');
                        outputLine.className = 'terminal-line';
                        outputLine.style.color = '#0f0';
                        outputLine.textContent = 'Command simulation - actual execution requires system access';
                        terminalOutput.appendChild(outputLine);
                    }, 500);
                }
            }, 50);
        }

        // Copy to clipboard
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                // Show feedback
                event.target.textContent = 'Copied!';
                setTimeout(() => {
                    event.target.textContent = 'Copy';
                }, 2000);
            });
        }

        // Show tooltip
        function showTooltip(event, text) {
            tooltip.textContent = text;
            tooltip.style.left = event.pageX + 10 + 'px';
            tooltip.style.top = event.pageY + 10 + 'px';
            tooltip.classList.add('visible');
        }

        // Hide tooltip
        function hideTooltip() {
            tooltip.classList.remove('visible');
        }

        // Search functionality
        function performSearch(term) {
            searchTerm = term.toLowerCase();
            const allNodes = document.querySelectorAll('.tree-node');
            
            allNodes.forEach(node => {
                const label = node.querySelector('.tree-node-label');
                if (label) {
                    const text = label.textContent.toLowerCase();
                    const content = node.querySelector('.tree-node-content');
                    
                    if (searchTerm === '' || text.includes(searchTerm)) {
                        node.style.display = '';
                        content.style.opacity = '1';
                        
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
                        // Check if any children match
                        const childrenContainer = node.querySelector('.tree-children');
                        const hasMatchingChild = childrenContainer && 
                            Array.from(childrenContainer.querySelectorAll('.tree-node-label'))
                                .some(child => child.textContent.toLowerCase().includes(searchTerm));
                        
                        if (hasMatchingChild) {
                            node.style.display = '';
                            content.style.opacity = '0.5';
                        } else {
                            node.style.display = 'none';
                        }
                    }
                }
            });
        }

        // Initialize the application
        async function init() {
            // Load system data from JSON files
            await loadSystemData();
            
            // Build flat node list for navigation
            buildNodeList(linuxSystemData);
            
            // Set up view switching
            document.querySelectorAll('.view-btn[data-view]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    switchView(e.target.dataset.view);
                });
            });
            
            // Set up tab switching
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tabName = e.target.dataset.tab;
                    
                    // Update active states
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                    
                    e.target.classList.add('active');
                    document.getElementById(`${tabName}-tab`).classList.add('active');
                });
            });
            
            // Set up bookmarks button
            document.getElementById('bookmarks-btn').addEventListener('click', toggleBookmarksPanel);
            
            // Set up learning button
            document.getElementById('learning-btn').addEventListener('click', toggleLearningPanel);
            
            // Set up shortcuts button
            document.getElementById('shortcuts-btn').addEventListener('click', toggleShortcutsModal);
            
            // Set up theme switcher
            document.querySelectorAll('.theme-btn[data-theme]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    switchTheme(e.target.dataset.theme);
                });
            });
            
            // Initialize learning features if data is available
            if (learningData) {
                initializeLearning();
            }
            
            // Show progress tracker if user has progress
            if (userProgress.nodesVisited.length > 0) {
                document.getElementById('progress-tracker').style.display = 'block';
                updateProgressTracker();
            }
            
            // Set up search
            const searchInput = document.querySelector('.search-input');
            // Use debounced search for better performance
            const debouncedSearch = debounce((value) => {
                performance.mark('search-start');
                if (searchWorker) {
                    searchWorker.postMessage({
                        type: 'SEARCH',
                        data: { query: value }
                    });
                } else {
                    performSearch(value);
                }
            }, 300);
            
            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                // Ctrl+F or Cmd+F to focus search
                if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                    e.preventDefault();
                    searchInput.focus();
                    searchInput.select();
                }
                
                // Ctrl+P for command palette
                if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                    e.preventDefault();
                    toggleCommandPalette();
                }
                
                // Ctrl+B to bookmark current node
                if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                    e.preventDefault();
                    if (currentNodeData) {
                        toggleBookmark(currentNodeData);
                    }
                }
                
                // View switching with number keys
                if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                    if (e.key === '1') switchView('tree');
                    if (e.key === '2') switchView('graph');
                    if (e.key === '3') switchView('table');
                    
                    // Vim-style navigation
                    if (currentView === 'tree') {
                        if (e.key === 'j' || e.key === 'ArrowDown') navigateTree('down');
                        if (e.key === 'k' || e.key === 'ArrowUp') navigateTree('up');
                        if (e.key === 'h' || e.key === 'ArrowLeft') navigateTree('collapse');
                        if (e.key === 'l' || e.key === 'ArrowRight') navigateTree('expand');
                        if (e.key === 'Enter') navigateTree('select');
                    }
                    
                    // Toggle panels
                    if (e.key === 'b') toggleBookmarksPanel();
                    if (e.key === 'm') toggleMinimap();
                    if (e.key === '?') toggleShortcutsModal();
                }
                
                // Escape to close modals
                if (e.key === 'Escape') {
                    closeAllModals();
                    searchInput.value = '';
                    performSearch('');
                    searchInput.blur();
                }
            });
            
            // Close info panel when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    const panel = document.getElementById('info-panel');
                    if (!panel.contains(e.target) && !e.target.closest('.tree-node-content')) {
                        panel.classList.remove('active');
                    }
                }
            });
        }

        // View Management Functions
        function switchView(viewName) {
            currentView = viewName;
            
            // Update button states
            document.querySelectorAll('.view-btn[data-view]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === viewName);
            });
            
            // Hide all views
            document.getElementById('tree-view').classList.remove('active');
            document.getElementById('graph-view').classList.remove('active');
            document.getElementById('table-view').classList.remove('active');
            
            // Show selected view
            document.getElementById(`${viewName}-view`).classList.add('active');
            
            // Initialize view-specific features
            if (viewName === 'graph') {
                initGraphView();
            } else if (viewName === 'table') {
                initTableView();
            }
        }
        
        // Build flat node list for navigation
        function buildNodeList(data, list = []) {
            if (data.children) {
                data.children.forEach(child => {
                    list.push(child);
                    buildNodeList(child, list);
                });
            }
            if (list.length === 0 && data.name) {
                list.push(data);
            }
            allNodes = list;
            return list;
        }
        
        // Graph View Implementation
        function initGraphView() {
            const canvas = document.getElementById('graph-canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            
            // Simple force-directed graph visualization
            const nodes = [];
            const links = [];
            
            // Convert tree to graph nodes
            function processNode(node, parent = null, x = canvas.width/2, y = canvas.height/2) {
                const graphNode = {
                    id: node.id || node.name,
                    name: node.name,
                    type: node.type,
                    x: x + (Math.random() - 0.5) * 200,
                    y: y + (Math.random() - 0.5) * 200,
                    vx: 0,
                    vy: 0
                };
                nodes.push(graphNode);
                
                if (parent) {
                    links.push({ source: parent, target: graphNode });
                }
                
                if (node.children) {
                    node.children.forEach(child => {
                        processNode(child, graphNode, graphNode.x, graphNode.y);
                    });
                }
            }
            
            processNode(linuxSystemData);
            
            // Draw function
            function draw() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw links
                ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
                ctx.lineWidth = 1;
                links.forEach(link => {
                    ctx.beginPath();
                    ctx.moveTo(link.source.x, link.source.y);
                    ctx.lineTo(link.target.x, link.target.y);
                    ctx.stroke();
                });
                
                // Draw nodes
                nodes.forEach(node => {
                    const colors = {
                        kernel: '#e74c3c',
                        userspace: '#3498db',
                        filesystem: '#2ecc71',
                        network: '#f39c12',
                        service: '#9b59b6'
                    };
                    
                    ctx.fillStyle = colors[node.type] || '#667eea';
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI);
                    ctx.fill();
                    
                    // Draw label
                    ctx.fillStyle = '#eee';
                    ctx.font = '10px Arial';
                    ctx.fillText(node.name, node.x + 10, node.y + 3);
                });
            }
            
            // Optimized force simulation with frame rate control
            let lastFrameTime = 0;
            const targetFPS = 60;
            const frameInterval = 1000 / targetFPS;
            
            function simulate(currentTime) {
                // Frame rate limiting
                if (currentTime - lastFrameTime < frameInterval) {
                    requestAnimationFrame(simulate);
                    return;
                }
                lastFrameTime = currentTime;
                
                // Apply forces
                nodes.forEach((node, i) => {
                    // Center force
                    node.vx += (canvas.width/2 - node.x) * 0.0001;
                    node.vy += (canvas.height/2 - node.y) * 0.0001;
                    
                    // Repulsion between nodes
                    nodes.forEach((other, j) => {
                        if (i !== j) {
                            const dx = node.x - other.x;
                            const dy = node.y - other.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < 100 && distance > 0) {
                                const force = 50 / distance;
                                node.vx += dx / distance * force;
                                node.vy += dy / distance * force;
                            }
                        }
                    });
                });
                
                // Update positions
                nodes.forEach(node => {
                    node.vx *= 0.9; // Damping
                    node.vy *= 0.9;
                    node.x += node.vx;
                    node.y += node.vy;
                    
                    // Keep in bounds
                    node.x = Math.max(20, Math.min(canvas.width - 20, node.x));
                    node.y = Math.max(20, Math.min(canvas.height - 20, node.y));
                });
                
                draw();
                requestAnimationFrame(simulate);
            }
            
            simulate();
        }
        
        // Table View Implementation
        function initTableView() {
            const tbody = document.getElementById('table-body');
            tbody.innerHTML = '';
            
            allNodes.forEach(node => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${node.name}</td>
                    <td><span class="table-badge" style="background: var(--${node.type}-color)">${node.type || 'unknown'}</span></td>
                    <td>${node.level || '-'}</td>
                    <td style="font-family: monospace; font-size: 12px;">${(node.metadata && node.metadata.path) || '-'}</td>
                    <td>${node.description || (node.metadata && node.metadata.description) || '-'}</td>
                `;
                tr.addEventListener('click', () => {
                    currentNodeData = node;
                    updateInfoPanel(node);
                });
                tbody.appendChild(tr);
            });
        }
        
        // Tree Navigation
        function navigateTree(direction) {
            const visibleNodes = Array.from(document.querySelectorAll('.tree-node-content:not([style*="display: none"])'));
            
            if (direction === 'down') {
                focusedNodeIndex = Math.min(focusedNodeIndex + 1, visibleNodes.length - 1);
            } else if (direction === 'up') {
                focusedNodeIndex = Math.max(focusedNodeIndex - 1, 0);
            }
            
            if (visibleNodes[focusedNodeIndex]) {
                // Remove previous focus
                visibleNodes.forEach(n => n.style.outline = '');
                // Add focus outline
                visibleNodes[focusedNodeIndex].style.outline = '2px solid var(--selected-bg)';
                visibleNodes[focusedNodeIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                if (direction === 'expand') {
                    const icon = visibleNodes[focusedNodeIndex].querySelector('.tree-node-icon');
                    const children = visibleNodes[focusedNodeIndex].parentElement.querySelector('.tree-children');
                    if (children && !children.classList.contains('expanded')) {
                        children.classList.add('expanded');
                        if (icon) icon.classList.add('expanded');
                    }
                } else if (direction === 'collapse') {
                    const icon = visibleNodes[focusedNodeIndex].querySelector('.tree-node-icon');
                    const children = visibleNodes[focusedNodeIndex].parentElement.querySelector('.tree-children');
                    if (children && children.classList.contains('expanded')) {
                        children.classList.remove('expanded');
                        if (icon) icon.classList.remove('expanded');
                    }
                } else if (direction === 'select') {
                    visibleNodes[focusedNodeIndex].click();
                }
            }
        }
        
        // Command Palette
        function toggleCommandPalette() {
            const palette = document.getElementById('command-palette');
            const input = document.getElementById('command-input');
            const results = document.getElementById('command-results');
            
            if (palette.classList.contains('active')) {
                palette.classList.remove('active');
            } else {
                palette.classList.add('active');
                input.value = '';
                input.focus();
                
                // Build command list
                const commands = [
                    { label: 'Switch to Tree View', action: () => switchView('tree'), shortcut: '1' },
                    { label: 'Switch to Graph View', action: () => switchView('graph'), shortcut: '2' },
                    { label: 'Switch to Table View', action: () => switchView('table'), shortcut: '3' },
                    { label: 'Toggle Bookmarks', action: toggleBookmarksPanel, shortcut: 'B' },
                    { label: 'Toggle Mini-map', action: toggleMinimap, shortcut: 'M' },
                    { label: 'Show Shortcuts', action: toggleShortcutsModal, shortcut: '?' },
                    ...allNodes.map(node => ({
                        label: `Go to: ${node.name}`,
                        action: () => {
                            currentNodeData = node;
                            updateInfoPanel(node);
                            closeAllModals();
                        }
                    }))
                ];
                
                // Filter function
                input.addEventListener('input', () => {
                    const query = input.value.toLowerCase();
                    const filtered = commands.filter(cmd => 
                        cmd.label.toLowerCase().includes(query)
                    );
                    
                    results.innerHTML = '';
                    filtered.slice(0, 10).forEach(cmd => {
                        const item = document.createElement('div');
                        item.className = 'command-palette-item';
                        item.innerHTML = `
                            <span class="command-palette-icon">▶</span>
                            <span class="command-palette-label">${cmd.label}</span>
                            ${cmd.shortcut ? `<span class="command-palette-shortcut">${cmd.shortcut}</span>` : ''}
                        `;
                        item.addEventListener('click', () => {
                            cmd.action();
                            palette.classList.remove('active');
                        });
                        results.appendChild(item);
                    });
                });
                
                // Trigger initial filter
                input.dispatchEvent(new Event('input'));
            }
        }
        
        // Bookmarks Management
        function toggleBookmark(node) {
            const index = bookmarks.findIndex(b => b.name === node.name);
            if (index > -1) {
                bookmarks.splice(index, 1);
            } else {
                bookmarks.push({ name: node.name, type: node.type });
            }
            localStorage.setItem('linuxMapBookmarks', JSON.stringify(bookmarks));
            updateBookmarksPanel();
        }
        
        function toggleBookmarksPanel() {
            const panel = document.getElementById('bookmarks-panel');
            panel.classList.toggle('active');
            if (panel.classList.contains('active')) {
                updateBookmarksPanel();
                updateHistoryPanel();
            }
        }
        
        function updateBookmarksPanel() {
            const list = document.getElementById('bookmarks-list');
            list.innerHTML = '';
            
            bookmarks.forEach(bookmark => {
                const item = document.createElement('div');
                item.className = 'bookmark-item';
                item.innerHTML = `
                    <span>${bookmark.name}</span>
                    <span class="bookmark-remove" onclick="toggleBookmark({name: '${bookmark.name}'})">×</span>
                `;
                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('bookmark-remove')) {
                        const node = allNodes.find(n => n.name === bookmark.name);
                        if (node) {
                            currentNodeData = node;
                            updateInfoPanel(node);
                        }
                    }
                });
                list.appendChild(item);
            });
            
            if (bookmarks.length === 0) {
                list.innerHTML = '<div style="color: var(--text-secondary); font-size: 13px;">No bookmarks yet</div>';
            }
        }
        
        function updateHistoryPanel() {
            const list = document.getElementById('history-list');
            list.innerHTML = '';
            
            history.slice(-5).reverse().forEach(item => {
                const div = document.createElement('div');
                div.className = 'bookmark-item';
                div.textContent = item.name;
                div.addEventListener('click', () => {
                    const node = allNodes.find(n => n.name === item.name);
                    if (node) {
                        currentNodeData = node;
                        updateInfoPanel(node);
                    }
                });
                list.appendChild(div);
            });
            
            if (history.length === 0) {
                list.innerHTML = '<div style="color: var(--text-secondary); font-size: 13px;">No history yet</div>';
            }
        }
        
        function addToHistory(node) {
            history.push({ name: node.name, type: node.type, timestamp: Date.now() });
            if (history.length > 20) history.shift();
            localStorage.setItem('linuxMapHistory', JSON.stringify(history));
        }
        
        // Toggle functions
        function toggleMinimap() {
            document.getElementById('minimap').classList.toggle('active');
        }
        
        function toggleShortcutsModal() {
            document.getElementById('shortcuts-modal').classList.toggle('active');
        }
        
        function closeAllModals() {
            document.getElementById('command-palette').classList.remove('active');
            document.getElementById('bookmarks-panel').classList.remove('active');
            document.getElementById('shortcuts-modal').classList.remove('active');
        }
        
        // Update the existing updateInfoPanel to track history and progress
        const originalUpdateInfoPanel = updateInfoPanel;
        updateInfoPanel = function(data) {
            currentNodeData = data;
            addToHistory(data);
            trackNodeVisit(data);
            originalUpdateInfoPanel(data);
        };
        
        // Learning System Functions
        function initializeLearning() {
            loadLearningPaths();
            loadChallenges();
            loadAchievements();
        }
        
        function loadLearningPaths() {
            const container = document.getElementById('learning-paths-list');
            if (!learningData || !learningData.paths) return;
            
            container.innerHTML = '';
            learningData.paths.forEach(path => {
                const progress = calculatePathProgress(path);
                const pathElement = document.createElement('div');
                pathElement.className = 'learning-path';
                pathElement.innerHTML = `
                    <div class="learning-path-header">
                        <span class="learning-path-icon">${path.icon}</span>
                        <span class="learning-path-title">${path.name}</span>
                    </div>
                    <div class="learning-path-description">${path.description}</div>
                    <div class="learning-progress">
                        <div class="learning-progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <div style="font-size: 11px; color: var(--text-secondary); margin-top: 5px;">
                        Progress: ${progress}%
                    </div>
                `;
                pathElement.addEventListener('click', () => startLearningPath(path));
                container.appendChild(pathElement);
            });
        }
        
        function calculatePathProgress(path) {
            if (!path.modules) return 0;
            let totalNodes = 0;
            let visitedNodes = 0;
            
            path.modules.forEach(module => {
                if (module.nodes) {
                    totalNodes += module.nodes.length;
                    module.nodes.forEach(nodeName => {
                        if (userProgress.nodesVisited.includes(nodeName)) {
                            visitedNodes++;
                        }
                    });
                }
            });
            
            return totalNodes > 0 ? Math.round((visitedNodes / totalNodes) * 100) : 0;
        }
        
        function startLearningPath(path) {
            userProgress.currentPath = path.id;
            saveProgress();
            
            // Find first incomplete module
            const nextModule = path.modules.find(module => {
                return module.nodes && module.nodes.some(nodeName => 
                    !userProgress.nodesVisited.includes(nodeName)
                );
            });
            
            if (nextModule) {
                // Start quiz if available
                if (nextModule.quiz && nextModule.quiz.length > 0) {
                    startQuiz(nextModule);
                } else {
                    // Navigate to first unvisited node
                    const unvisitedNode = nextModule.nodes.find(nodeName => 
                        !userProgress.nodesVisited.includes(nodeName)
                    );
                    if (unvisitedNode) {
                        const node = allNodes.find(n => n.name === unvisitedNode);
                        if (node) {
                            currentNodeData = node;
                            updateInfoPanel(node);
                        }
                    }
                }
            }
        }
        
        function startQuiz(module) {
            currentQuiz = {
                module: module,
                questions: module.quiz,
                currentIndex: 0,
                score: 0
            };
            
            document.getElementById('quiz-modal').classList.add('active');
            showQuizQuestion();
        }
        
        function showQuizQuestion() {
            if (!currentQuiz || currentQuiz.currentIndex >= currentQuiz.questions.length) {
                endQuiz();
                return;
            }
            
            const question = currentQuiz.questions[currentQuiz.currentIndex];
            document.getElementById('quiz-question').textContent = question.question;
            
            const optionsContainer = document.getElementById('quiz-options');
            optionsContainer.innerHTML = '';
            
            question.options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'quiz-option';
                optionElement.textContent = option;
                optionElement.addEventListener('click', () => selectQuizOption(index));
                optionsContainer.appendChild(optionElement);
            });
            
            document.getElementById('quiz-explanation').style.display = 'none';
            document.getElementById('quiz-score').textContent = `${currentQuiz.score}/${currentQuiz.currentIndex}`;
        }
        
        function selectQuizOption(index) {
            const question = currentQuiz.questions[currentQuiz.currentIndex];
            const options = document.querySelectorAll('.quiz-option');
            
            options.forEach((option, i) => {
                option.classList.remove('selected');
                if (i === index) {
                    option.classList.add('selected');
                    if (i === question.correct) {
                        option.classList.add('correct');
                        currentQuiz.score++;
                    } else {
                        option.classList.add('incorrect');
                    }
                }
                if (i === question.correct) {
                    option.classList.add('correct');
                }
            });
            
            // Show explanation
            document.getElementById('quiz-explanation').textContent = question.explanation;
            document.getElementById('quiz-explanation').style.display = 'block';
            
            // Disable further selection
            options.forEach(option => {
                option.style.pointerEvents = 'none';
            });
        }
        
        function endQuiz() {
            const moduleId = currentQuiz.module.id;
            userProgress.quizzesCompleted.push(moduleId);
            userProgress.scores[moduleId] = currentQuiz.score;
            saveProgress();
            updateProgressTracker();
            checkAchievements();
            
            document.getElementById('quiz-modal').classList.remove('active');
            currentQuiz = null;
        }
        
        document.getElementById('quiz-next').addEventListener('click', () => {
            if (currentQuiz) {
                currentQuiz.currentIndex++;
                showQuizQuestion();
            }
        });
        
        function loadChallenges() {
            const container = document.getElementById('challenges-list');
            if (!learningData || !learningData.challenges) return;
            
            container.innerHTML = '';
            learningData.challenges.forEach(challenge => {
                const solved = userProgress.challengesSolved.includes(challenge.id);
                const card = document.createElement('div');
                card.className = 'challenge-card';
                card.innerHTML = `
                    <div class="challenge-title">${challenge.name} ${solved ? '✅' : ''}</div>
                    <div class="challenge-scenario">${challenge.scenario}</div>
                    ${!solved ? `
                        <input type="text" class="challenge-input" id="challenge-${challenge.id}" 
                               placeholder="Enter your solution...">
                        <div class="challenge-hint">Hint: ${challenge.hint}</div>
                        <button class="view-btn" onclick="checkChallenge('${challenge.id}')">Submit</button>
                        <div id="challenge-result-${challenge.id}"></div>
                    ` : `
                        <div class="challenge-result success">Solved! +${challenge.points} points</div>
                    `}
                `;
                container.appendChild(card);
            });
        }
        
        function checkChallenge(challengeId) {
            const challenge = learningData.challenges.find(c => c.id === challengeId);
            const input = document.getElementById(`challenge-${challengeId}`).value.trim();
            const resultDiv = document.getElementById(`challenge-result-${challengeId}`);
            
            // Simple check - in real app would be more sophisticated
            if (input.toLowerCase().includes(challenge.solution.toLowerCase()) || 
                challenge.solution.toLowerCase().includes(input.toLowerCase())) {
                resultDiv.className = 'challenge-result success';
                resultDiv.textContent = `Correct! Solution: ${challenge.solution}`;
                userProgress.challengesSolved.push(challengeId);
                saveProgress();
                updateProgressTracker();
                checkAchievements();
                setTimeout(() => loadChallenges(), 2000);
            } else {
                resultDiv.className = 'challenge-result error';
                resultDiv.textContent = 'Not quite right. Try again!';
            }
        }
        
        function loadAchievements() {
            const container = document.getElementById('achievements-grid');
            if (!learningData || !learningData.achievements) return;
            
            container.innerHTML = '';
            learningData.achievements.forEach(achievement => {
                const unlocked = userProgress.achievements.includes(achievement.id);
                const badge = document.createElement('div');
                badge.className = `achievement-badge ${unlocked ? 'unlocked' : 'locked'}`;
                badge.innerHTML = `
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-name">${achievement.name}</div>
                `;
                badge.title = achievement.description;
                container.appendChild(badge);
            });
        }
        
        function checkAchievements() {
            if (!learningData || !learningData.achievements) return;
            
            learningData.achievements.forEach(achievement => {
                if (!userProgress.achievements.includes(achievement.id)) {
                    let earned = false;
                    
                    switch (achievement.condition.type) {
                        case 'nodes_visited':
                            earned = userProgress.nodesVisited.length >= achievement.condition.count;
                            break;
                        case 'modules_completed':
                            earned = userProgress.quizzesCompleted.length >= achievement.condition.count;
                            break;
                        case 'bookmarks_created':
                            earned = bookmarks.length >= achievement.condition.count;
                            break;
                        case 'perfect_quizzes':
                            const perfectCount = Object.values(userProgress.scores).filter(s => s === 100).length;
                            earned = perfectCount >= achievement.condition.count;
                            break;
                        case 'all_challenges':
                            earned = userProgress.challengesSolved.length === learningData.challenges.length;
                            break;
                        case 'path_completed':
                            const path = learningData.paths.find(p => p.id === achievement.condition.path);
                            earned = path && calculatePathProgress(path) === 100;
                            break;
                    }
                    
                    if (earned) {
                        userProgress.achievements.push(achievement.id);
                        showAchievementNotification(achievement);
                        saveProgress();
                        loadAchievements();
                    }
                }
            });
        }
        
        function showAchievementNotification(achievement) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 3000;
                animation: slideInRight 0.5s ease;
            `;
            notification.innerHTML = `
                <div style="font-size: 18px; margin-bottom: 5px;">🎉 Achievement Unlocked!</div>
                <div style="font-size: 14px;">${achievement.icon} ${achievement.name}</div>
                <div style="font-size: 12px; opacity: 0.9;">${achievement.description}</div>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.5s ease';
                setTimeout(() => notification.remove(), 500);
            }, 3000);
        }
        
        function trackNodeVisit(node) {
            if (!userProgress.nodesVisited.includes(node.name)) {
                userProgress.nodesVisited.push(node.name);
                saveProgress();
                updateProgressTracker();
                checkAchievements();
            }
        }
        
        function updateProgressTracker() {
            document.getElementById('nodes-visited').textContent = userProgress.nodesVisited.length;
            document.getElementById('quizzes-completed').textContent = userProgress.quizzesCompleted.length;
            document.getElementById('challenges-solved').textContent = userProgress.challengesSolved.length;
            document.getElementById('achievements-unlocked').textContent = userProgress.achievements.length;
        }
        
        function saveProgress() {
            localStorage.setItem('linuxMapProgress', JSON.stringify(userProgress));
        }
        
        function toggleLearningPanel() {
            const panel = document.getElementById('learning-panel');
            panel.classList.toggle('active');
            
            if (panel.classList.contains('active')) {
                loadLearningPaths();
                loadChallenges();
                loadAchievements();
            }
        }
        
        function switchTheme(theme) {
            document.body.className = theme === 'dark' ? '' : `${theme}-theme`;
            
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === theme);
            });
            
            localStorage.setItem('linuxMapTheme', theme);
        }
        
        // Load saved theme
        const savedTheme = localStorage.getItem('linuxMapTheme') || 'dark';
        if (savedTheme !== 'dark') {
            switchTheme(savedTheme);
        }
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // Update the existing updateInfoPanel to track history and progress
        const originalUpdateInfoPanel = updateInfoPanel;
        updateInfoPanel = function(data) {
            currentNodeData = data;
            addToHistory(data);
            trackNodeVisit(data);
            originalUpdateInfoPanel(data);
        };
        
        // Make checkChallenge global
        window.checkChallenge = checkChallenge;
        
        // Start the application when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    </script>
</body>
</html>