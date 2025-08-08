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
            };
        }
