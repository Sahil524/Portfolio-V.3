// terminal.js
import React, { useEffect, useRef, useState } from "react";
import "./terminal.css";

const VFS = {
    "C:": {
        Users: {
            Guest: {
                resume: { files: ["resume.pdf"] },
                projects: { files: ["ecommerce.pdf", "ai_platform.pdf"] },
                experience: { files: ["work_history.pdf"] },
                skills: { files: ["technical_stack.pdf"] }
            }
        }
    }
};


const BOOT_LINES = [
    { type: "system", text: "Microsoft Windows [Version 10.0.19045.3626]" },
    { type: "system", text: "(c) 2026 Sahil Corporation. All rights reserved." }
];

const COLOR_MAP = {
    red: "#ff4d4d",
    green: "#00ff9c",
    blue: "#4da6ff",
    yellow: "#ffd84d",
    purple: "#b84dff",
    cyan: "#00ffff",
    white: "#ffffff",
    orange: "#ff9933"
};



const emailAddress = "sahilsawant182@gmail.com";

export default function Terminal() {
    const [outputBuffer, setOutputBuffer] = useState([]);
    const [inputBuffer, setInputBuffer] = useState("");
    const [cursorIndex, setCursorIndex] = useState(0);
    const [commandHistory, setCommandHistory] = useState([]);
    const [historyPointer, setHistoryPointer] = useState(0);
    const [currentPath, setCurrentPath] = useState("C:\\Users\\Guest");
    const [flashbangActive, setFlashbangActive] = useState(false);
    const [modalFile, setModalFile] = useState(null);
    const [matrixMode, setMatrixMode] = useState(false);
    const [terminalColor, setTerminalColor] = useState("#fca311");


    const terminalRef = useRef(null);
    const matrixRef = useRef(null);

    const errorSound = useRef(null);
    const flashbangSound = useRef(null);
    const audioUnlockedRef = useRef(false);

    const [mediaSession, setMediaSession] = useState(null)
    const [typingTest, setTypingTest] = useState(null)
    const autoScrollRef = useRef(null)

    const isRecordingRef = useRef(false);

    const [gameActive, setGameActive] = useState(false);

    const lastOutputRef = useRef("");

    const mediaSessionRef = useRef(null);


    useEffect(() => {
        errorSound.current = new Audio("./assets/audio/error.mp3");
        flashbangSound.current = new Audio("./assets/audio/flashbang.mp3");

        [errorSound.current, flashbangSound.current].forEach(a => {
            a.preload = "auto";
            a.volume = 1;
        });
    }, []);

    const unlockAudio = () => {
        if (audioUnlockedRef.current) return;

        audioUnlockedRef.current = true;

        [errorSound.current, flashbangSound.current].forEach(sound => {
            if (!sound) return;

            sound.muted = true;
            sound.play({ muted: true }).then(() => {
                sound.pause();
                sound.currentTime = 0;
                sound.muted = false;
            }).catch(() => { });
        });
    };

    const playSound = (audioRef) => {
        if (!audioUnlockedRef.current || !audioRef?.current) return;

        audioRef.current.pause();
        audioRef.current.currentTime = 0;

        audioRef.current.play().catch(() => { });
    };

    // ADD below keySound ref

    const levenshtein = (a, b) => {
        const m = Array.from({ length: a.length + 1 }, () =>
            Array(b.length + 1).fill(0)
        )
        for (let i = 0; i <= a.length; i++) m[i][0] = i
        for (let j = 0; j <= b.length; j++) m[0][j] = j

        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1
                m[i][j] = Math.min(
                    m[i - 1][j] + 1,
                    m[i][j - 1] + 1,
                    m[i - 1][j - 1] + cost
                )
            }
        }
        return m[a.length][b.length]
    }

    const getClosestCommand = (cmd) => {
        const keys = Object.keys(commandRegistry)
        let best = null
        let score = Infinity

        keys.forEach(k => {
            const d = levenshtein(cmd, k)
            if (d < score) {
                score = d
                best = k
            }
        })

        return score <= 2 ? best : null
    }

    const startRecording = async (mode) => {
        terminalRef.current?.focus();

        if (!window.isSecureContext) {
            pushOutput("error", "Recording requires HTTPS.");
            return;
        }

        if (!navigator.userActivation?.isActive) {
            pushOutput("error", "Click terminal, then retry.");
            return;
        }

        try {
            let stream;

            if (mode === "screen") {
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { frameRate: { ideal: 60, max: 60 } },
                    audio: true
                });
            } else {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: mode !== "webcam" ? true : true,
                    video: mode === "webcam"
                        ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
                        : false
                });
            }

            if (!stream || stream.getTracks().length === 0) {
                throw new Error("Empty media stream");
            }

            const mimeCandidates = [
                "video/webm;codecs=vp9,opus",
                "video/webm;codecs=vp8,opus",
                "video/webm",
                "audio/webm;codecs=opus",
                "audio/webm"
            ];

            const mimeType = mimeCandidates.find(t => MediaRecorder.isTypeSupported(t)) || "";

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            const chunks = [];

            recorder.ondataavailable = e => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };

            recorder.onerror = () => {
                pushOutput("error", "MediaRecorder error.");
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
                const url = URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = `sahil_${mode}_${Date.now()}.webm`;
                a.click();

                URL.revokeObjectURL(url);

                pushOutput("system", "Recording saved.");
                isRecordingRef.current = false;
                setMediaSession(null);
            };

            recorder.start(200);
            isRecordingRef.current = true;

            mediaSessionRef.current = { recorder, stream };
            setMediaSession({ recorder, stream });
            setInputBuffer("");
            setCursorIndex(0);

            pushOutput("system", `${mode.toUpperCase()} recording started. Press ENTER to stop.`);
        } catch (err) {
            console.error(err);
            pushOutput("error", "Permission denied or device unavailable.");
        }
    };
    const stopRecording = () => {
        const session = mediaSessionRef.current;
        if (!session) return;

        try {
            const { recorder, stream } = session;

            if (recorder && recorder.state !== "inactive") {
                recorder.stop();
            }

            if (stream) {
                stream.getTracks().forEach(t => t.stop());
            }

            isRecordingRef.current = false;
            setMediaSession(null);
            setInputBuffer("");
            setCursorIndex(0);

            pushOutput("system", "Recording stopped.");
        } catch (err) {
            console.error(err);
            pushOutput("error", "Failed to stop recording.");
        }
        mediaSessionRef.current = null;
    };

    const pushOutput = (type, text) => {
        if (lastOutputRef.current === text) return;
        lastOutputRef.current = text;

        setOutputBuffer((prev) => [
            ...prev,
            { id: Date.now() + Math.random(), type, text },
        ]);

        if (type === "error" && audioUnlockedRef.current && errorSound.current) {
            playSound(errorSound);
        }

    };

    const resolvePathObject = (path) => {
        const parts = path.replace("C:\\", "").split("\\").filter(Boolean);
        let node = VFS["C:"];

        for (const part of parts) {
            if (!node[part]) return null;
            node = node[part];
        }

        return node;
    };

    const triggerShake = () => {
        terminalRef.current.classList.add("shake");
        setTimeout(() => {
            terminalRef.current.classList.remove("shake");
        }, 300);
    };


    useEffect(() => {
        setOutputBuffer(
            BOOT_LINES.map((l) => ({ ...l, id: Date.now() + Math.random() }))
        );
    }, []);

    useEffect(() => {
        const handler = (e) => {
            unlockAudio();

            if (e.code === "Space") {
                e.preventDefault();
            }
            if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.key)) {
                e.preventDefault();
            }

            if (e.key === "Escape") {
                if (modalFile) setModalFile(null);
                if (gameActive) setGameActive(false);
                return;
            }


            if (e.ctrlKey && e.key.toLowerCase() === "v") {
                e.preventDefault();
                navigator.clipboard.readText().then(text => {
                    const updated =
                        inputBuffer.slice(0, cursorIndex) +
                        text +
                        inputBuffer.slice(cursorIndex);

                    setInputBuffer(updated);
                    setCursorIndex(cursorIndex + text.length);
                });
                return;
            }


            if (e.key === "Enter") {
                e.preventDefault();
                unlockAudio();

                /* ===== RECORDING MODE (HIGHEST PRIORITY) ===== */
                if (isRecordingRef.current || mediaSession) {
                    stopRecording();
                    return;
                }
                terminalRef.current?.focus();

                /* ===== TYPING TEST MODE ===== */
                if (typingTest?.active) {
                    typingTest.finish();
                    return;
                }

                /* ===== NORMAL COMMAND EXECUTION ===== */
                const command = inputBuffer.trim();

                // Prevent empty prompt duplication
                if (!command.length) {
                    return;
                }

                executeCommand(command);

                requestAnimationFrame(() => {
                    if (autoScrollRef.current) {
                        autoScrollRef.current.scrollTop = autoScrollRef.current.scrollHeight;
                    }
                });

                return;

            }


            switch (e.key) {
                case "ArrowLeft":
                    setCursorIndex((c) => Math.max(0, c - 1));
                    break;
                case "ArrowRight":
                    setCursorIndex((c) => Math.min(inputBuffer.length, c + 1));
                    break;
                case "ArrowUp":
                    navigateHistory(1);
                    break;
                case "ArrowDown":
                    navigateHistory(-1);
                    break;
                case "Backspace":
                    if (cursorIndex > 0) {
                        const n =
                            inputBuffer.slice(0, cursorIndex - 1) +
                            inputBuffer.slice(cursorIndex);
                        setInputBuffer(n);
                        setCursorIndex(cursorIndex - 1);
                    }
                    break;
                case "Delete":
                    if (cursorIndex < inputBuffer.length) {
                        const n =
                            inputBuffer.slice(0, cursorIndex) +
                            inputBuffer.slice(cursorIndex + 1);
                        setInputBuffer(n);
                    }
                    break;
                case "Tab":
                    e.preventDefault();
                    autocomplete();
                    break;
                default:
                    if (e.key.length === 1) {
                        const n =
                            inputBuffer.slice(0, cursorIndex) +
                            e.key +
                            inputBuffer.slice(cursorIndex);
                        setInputBuffer(n);
                        setCursorIndex(cursorIndex + 1);
                    }
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [inputBuffer, cursorIndex, historyPointer, commandHistory, modalFile]);

    const navigateHistory = (dir) => {
        if (!commandHistory.length) return;

        let next = historyPointer + dir;

        if (next < -1) next = -1;
        if (next >= commandHistory.length) next = commandHistory.length - 1;

        setHistoryPointer(next);

        if (next === -1) {
            setInputBuffer("");
            setCursorIndex(0);
            return;
        }

        const cmd = commandHistory[commandHistory.length - 1 - next];
        setInputBuffer(cmd);
        setCursorIndex(cmd.length);
    };

    const autocomplete = () => {
        const parts = inputBuffer.trim().split(" ");
        const last = parts[parts.length - 1].toLowerCase();

        const node = resolvePathObject(currentPath);
        let candidates = [];

        if (parts.length === 1) {
            candidates = Object.keys(commandRegistry);
        } else if (node) {
            candidates = Object.keys(node).filter(k => k !== "files");
            if (node.files) candidates = candidates.concat(node.files);
        }

        const match = candidates.find(c => c.toLowerCase().startsWith(last));
        if (!match) return;

        parts[parts.length - 1] = match;
        const result = parts.join(" ");
        setInputBuffer(result);
        setCursorIndex(result.length);
    };

    const executeCommand = (raw) => {
        if (!isRecordingRef.current && raw.trim().length) {
            pushOutput("command", `${currentPath}> ${raw}`);
        }



        if (!raw) {
            setInputBuffer("")
            setCursorIndex(0)
            return
        }

        setCommandHistory((h) => [...h, raw])
        setHistoryPointer(-1)

        const [cmd, ...args] = raw.split(" ")
        const key = cmd.toLowerCase()

        let handler = commandRegistry[key]

        if (!handler) {
            const suggestion = getClosestCommand(key)
            if (suggestion) {
                pushOutput("info", `Auto-correct applied: ${key} -> ${suggestion}`)
                handler = commandRegistry[suggestion]
            }
        }

        if (handler) handler(args.join(" "))
        else pushOutput("error", `'${cmd}' is not recognized as an internal or external command.`)

        setInputBuffer("")
        setCursorIndex(0)
    }

    const commandRegistry = {
        help: () => {
            pushOutput(
                "system",
                `AVAILABLE COMMANDS
------------------

[ SYSTEM ]
dir          : List files and folders in current directory
cd <name>    : Navigate to a folder (e.g., "cd projects")
cls          : Clear the terminal
ipconfig     : Display your network connection details
type <file>  : Open file

[ AI AGENTS ]
/ask <query> : General Q&A with the base AI

[ TOOLS & EXTRAS ]
contact      : Open contact methods
webcam       : Start webcam recording
mic          : Start microphone recording
screen-rec   : Start screen recording
speedtest    : Run a network speed test
typingtest   : Start a 45-second typing test
/game        : Play a Game
color <hex|name> : Change terminal text color (red, green, blue...)
calc <math>  : Calculate an equation (e.g., "calc 20*5")
weather      : Show weather in your current location
loc          : Display your geolocation data
matrix       : Toggle "The Matrix" rain effect
joke         : Fetch a random dev joke

------------------
Type a command to begin.`
            );
        },




        dir: () => {
            const node = resolvePathObject(currentPath);

            if (!node) {
                pushOutput("error", "Directory access failure.");
                return;
            }

            if (node.files) {
                node.files.forEach(f => {
                    pushOutput("info", f.padEnd(25) + "PDF FILE");
                });
            } else {
                Object.keys(node).forEach(key => {
                    if (key !== "files") {
                        pushOutput("info", "<DIR>     " + key);
                    }
                });
            }
        },



        cd: (arg) => {
            if (!arg) return;

            if (arg === "..") {
                if (currentPath === "C:\\Users\\Guest") {
                    pushOutput("joke", "You can’t escape the matrix...");
                    return;
                }
                const newPath = currentPath.split("\\").slice(0, -1).join("\\");
                setCurrentPath(newPath);
                return;
            }

            const node = resolvePathObject(currentPath);
            if (node && node[arg]) {
                setCurrentPath(currentPath + "\\" + arg);
            } else {
                pushOutput("error", "The system cannot find the path specified.");
            }
        },


        type: (arg) => {
            const node = resolvePathObject(currentPath);

            if (node?.files?.includes(arg)) {
                setModalFile(arg);
            } else {
                pushOutput("error", "The system cannot find the file specified.");
            }
        },


        cls: () => {
            setFlashbangActive(true);

            if (audioUnlockedRef.current && flashbangSound.current) {
                playSound(flashbangSound);
            }

            setOutputBuffer([]);

            setTimeout(() => {
                setFlashbangActive(false);
            }, 5000);
        },

        del: () => {
            triggerShake();
            pushOutput("error", "don’t sabotage my career now, come on…");
        },

        rm: () => {
            triggerShake();
            pushOutput("error", "don’t sabotage my career now, come on…");
        },

        ipconfig: async () => {
            try {
                const ip = await fetch("https://api.ipify.org?format=json").then(r => r.json());
                const geo = await fetch(`https://ipapi.co/${ip.ip}/json/`).then(r => r.json());
                const battery = navigator.getBattery ? await navigator.getBattery() : null;

                pushOutput("system", "Connection Status . . . . . : SECURE");
                pushOutput("info", `IPv4 Address . . . . . . . : ${ip.ip}`);
                pushOutput("info", `ISP Provider . . . . . . : ${geo.org || "Private Network"}`);
                pushOutput("info", `City . . . . . . . . . . : ${geo.city}`);
                pushOutput("info", `Region . . . . . . . . . : ${geo.region_name}`);
                pushOutput("info", `Postal Code . . . . . . : ${geo.postal}`);
                pushOutput("info", `Country Code . . . . . : ${geo.country_code}`);
                pushOutput("info", `Country . . . . . . . . : ${geo.country_name}`);
                pushOutput("info", `Latitude . . . . . . . : ${geo.latitude}`);
                pushOutput("info", `Longitude . . . . . . : ${geo.longitude}`);

                pushOutput("system", "Device Profile");
                pushOutput("info", `CPU Threads . . . . . . : ${navigator.hardwareConcurrency}`);
                pushOutput("info", `RAM Estimate . . . . . . : ${navigator.deviceMemory || "Unknown"} GB`);
                const { width: screenW, height: screenH } = window.screen
                pushOutput("info", `Resolution . . . . . . . : ${screenW}x${screenH}`)
                pushOutput("info", `Color Depth . . . . . . : ${window.screen.colorDepth}-bit`)
                pushOutput("info", `Timezone . . . . . . . : ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
                pushOutput("info", `Language . . . . . . . : ${navigator.language}`)
                pushOutput("info", `Touch Support . . . . . : ${"ontouchstart" in window ? "Yes" : "No"}`)
                pushOutput("info", `OS Platform . . . . . . : ${navigator.platform}`);
                pushOutput("info", `User Agent . . . . . . : ${navigator.userAgent.split("(")[0]}`);

                if (battery) {
                    pushOutput("system", "Battery Information");
                    pushOutput("info", `Level . . . . . . . . . : ${Math.round(battery.level * 100)}%`);
                    pushOutput("info", `Charging . . . . . . . : ${battery.charging ? "Yes" : "No"}`);
                    pushOutput("info", `Health Status . . . . . : EXCELLENT`);
                }

            } catch {
                pushOutput("error", "Network adapter failure.");
            }
        },


        "/ask": async (prompt) => {
            if (!prompt) {
                pushOutput("error", "Usage: /ask <question>");
                return;
            }

            const fakeResponse =
                "Analyzing query... Synthesizing response... Sahil LLM Output: Always design systems that scale horizontally and fail gracefully.";

            let index = 0;
            const id = Date.now();

            setOutputBuffer(prev => [
                ...prev,
                { id, type: "info", text: "" }
            ]);

            const typer = setInterval(() => {
                index++;
                setOutputBuffer(prev =>
                    prev.map(l =>
                        l.id === id ? { ...l, text: fakeResponse.slice(0, index) } : l
                    )
                );
                if (index === fakeResponse.length) clearInterval(typer);
            }, 25);
        },

        color: (value) => {
            if (!value) {
                pushOutput("error", "Usage: color <hex|name>");
                return;
            }

            const v = value.toLowerCase();

            if (COLOR_MAP[v]) {
                setTerminalColor(COLOR_MAP[v]);
                return;
            }

            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                setTerminalColor(value);
                return;
            }

            pushOutput("error", "Invalid color value.");
        },


        calc: (expr) => {
            try {
                if (!/^[0-9+\-*/(). ]+$/.test(expr)) throw new Error();
                const res = Function(`"use strict";return (${expr})`)();
                pushOutput("info", `Result: ${res}`);
            } catch {
                pushOutput("error", "Invalid expression.");
            }
        },

        matrix: () => setMatrixMode((m) => !m),

        weather: async () => {
            try {
                const geo = await fetch("https://ipapi.co/json/").then((r) =>
                    r.json()
                );
                const w = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current_weather=true`
                ).then((r) => r.json());
                pushOutput(
                    "info",
                    `Weather @ ${geo.city}\nTemp: ${w.current_weather.temperature}°C\nWind: ${w.current_weather.windspeed}km/h`
                );
            } catch {
                pushOutput("error", "Weather unavailable.");
            }
        },

        joke: async () => {
            try {
                const res = await fetch("https://v2.jokeapi.dev/joke/Dark?type=single");
                const data = await res.json();

                if (!data.error) {
                    pushOutput("joke", data.joke);
                } else {
                    pushOutput("error", "Joke service unavailable.");
                }
            } catch {
                pushOutput("error", "Joke service unreachable.");
            }
        },


        loc: async () => {
            try {
                const d = await fetch("https://ipapi.co/json/").then((r) =>
                    r.json()
                );
                pushOutput("info", `${d.city}, ${d.country_name}`);
            } catch {
                pushOutput("error", "Location unavailable.");
            }
        },

        contact: async () => {
            await navigator.clipboard.writeText(emailAddress);
            pushOutput("info", "Email copied to clipboard.");
        },

        webcam: () => startRecording("webcam"),

        mic: () => startRecording("mic"),

        "screen-rec": () => startRecording("screen"),

        speedtest: async () => {

            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

            pushOutput("system", "Running Sahil Network Diagnostics PRO...");

            const start = performance.now();
            await fetch("https://jsonplaceholder.typicode.com/posts");
            const latency = Math.round(performance.now() - start);

            const downlink = conn?.downlink || (Math.random() * 80 + 20).toFixed(1);

            pushOutput("info", `Latency . . . . . . . : ${latency} ms`);
            pushOutput("info", `Download Speed . . . . : ${downlink} Mbps`);
            pushOutput("info", `Connection Type . . . . : ${conn?.effectiveType?.toUpperCase() || "UNKNOWN"}`);
            pushOutput("system", "Network Status: OPTIMAL");
        },

        typingtest: () => {

            const text = "The quick brown fox jumps over the lazy developer debugging production at 3am.";
            let typedChars = 0;
            const startTime = Date.now();

            pushOutput("system", "Typing Test Started — 45 seconds");
            pushOutput("info", text);

            const keyListener = (e) => {
                if (e.key === text[typedChars]) typedChars++;
                if (typedChars === text.length) finish();

            };

            window.addEventListener("keydown", keyListener);

            const finish = () => {

                const elapsed = (Date.now() - startTime) / 1000;
                const wpm = Math.round((typedChars / 5) / (elapsed / 60));

                window.removeEventListener("keydown", keyListener);

                pushOutput("system", "Typing Test Finished");
                pushOutput("info", `Speed: ${wpm} WPM`);
                pushOutput("info", `Accuracy: ${(90 + Math.random() * 8).toFixed(1)}%`);

                setTypingTest(null);
            };

            setTypingTest({ active: true, finish });

        },


        "/about": () =>
            pushOutput("system", "Sahil OS — Interactive Resume Terminal"),

        "/projects": () =>
            pushOutput(
                "system",
                "Projects:\n - E-commerce Platform\n - AI Platform"
            ),

        "/game": () => {
            pushOutput("system", "Launching Game Container...");
            setGameActive(true);
        },




    };


    useEffect(() => {
        if (!matrixMode) return;

        const chars = "01";
        const canvas = matrixRef.current;
        const ctx = canvas.getContext("2d");

        const outputEl = terminalRef.current.querySelector(".output");
        const rect = outputEl.getBoundingClientRect();

        const dpr = window.devicePixelRatio || 1;

        canvas.style.width = rect.width + "px";
        canvas.style.height = rect.height + "px";

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);



        const cols = Math.floor(rect.width / 14);
        const drops = Array(cols).fill(1);

        const draw = () => {
            ctx.fillStyle = "rgba(0,0,0,0.02)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = terminalColor;
            ctx.font = "14px monospace";

            drops.forEach((y, i) => {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * 14, y * 14);
                drops[i] = y * 14 > rect.height && Math.random() > 0.975 ? 0 : y + 1;
            });
        };

        const intervalId = setInterval(draw, 50);
        const autoStopId = setTimeout(() => setMatrixMode(false), 5000);

        return () => {
            clearInterval(intervalId);
            clearTimeout(autoStopId);
        };
    }, [matrixMode, terminalColor]);


    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;

                pushOutput("system", "Initializing Sahil OS Kernel...");
                setTimeout(() => pushOutput("system", "Loading AI Modules..."), 700);
                setTimeout(() => pushOutput("system", "Mounting Virtual File System..."), 1400);

                setTimeout(() => {
                    pushOutput(
                        "info",
                        `Type a command and press ENTER:

/about       :: Who is Sahil?
/projects    :: View case studies
/ask         :: Chat with Sahil's AI Agent
/game        :: Play a Game
dir          :: List all files in current folder
help         :: Show all commands`
                    );
                }, 2100);

                observer.disconnect();
            },
            { threshold: 0.5 }
        );

        if (terminalRef.current) observer.observe(terminalRef.current);
    }, []);

    useEffect(() => {
        if (autoScrollRef.current) {
            autoScrollRef.current.scrollTop = autoScrollRef.current.scrollHeight
        }
    }, [outputBuffer])




    return (
        <div
            className="terminal-container"
            style={{ color: terminalColor }}
            ref={terminalRef}
            onClick={() => {
                unlockAudio();
                terminalRef.current.focus();
            }}
            onContextMenu={async (e) => {
                e.preventDefault();
                const text = await navigator.clipboard.readText();
                const updated = inputBuffer.slice(0, cursorIndex) + text + inputBuffer.slice(cursorIndex);
                setInputBuffer(updated);
                setCursorIndex(cursorIndex + text.length);
            }}

            tabIndex={0}
        >
            {matrixMode && (
                <canvas
                    ref={matrixRef}
                    className="matrix-overlay"
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        zIndex: 999,
                    }}
                />
            )}

            {flashbangActive && <div className="flashbang" />}
            <div className="terminal-tabs">

                <div
                    className="terminal-tab active"
                >
                    TAB 1
                    <span
                        className="terminal-tab-close"
                    >×</span>
                </div>



                <div
                    className="terminal-tab-add"
                    onClick={() => {
                        pushOutput("error", "We aint got no more powern now.");
                        playSound(errorSound);
                    }}
                >
                    +
                </div>
            </div>


            <div className="output" ref={autoScrollRef} id="style-1">
                {!gameActive && (
                    <div>
                        {outputBuffer.map((l) => (
                            <div
                                key={l.id}
                                className={`line ${l.type}`}
                                style={{ whiteSpace: "pre-wrap" }}
                            >
                                {l.text}
                            </div>
                        ))}


                        {!mediaSession && (
                            <span className="prompt">{currentPath}&gt;</span>
                        )}
                        {!mediaSession && (
                            <span className="input-text">

                                {inputBuffer.slice(0, cursorIndex)}
                                <span className="cursor" />
                                {inputBuffer.slice(cursorIndex)}
                            </span>
                        )}
                    </div>
                )}
                {gameActive && (
                    <div className="game-wrapper">
                        <iframe
                            src="https://www.onlinegames.io/games/2024/unity/drift-king/index.html"
                            sandbox="allow-scripts allow-same-origin allow-forms"
                            frameBorder="0"
                            loading="lazy"
                            title="embedded-game"
                        />
                        <button
                            className="game-close-btn"
                            onClick={() => setGameActive(false)}
                        >
                            ✕
                        </button>
                    </div>
                )}

            </div>

            {modalFile && modalFile !== "GAME" && (
                <div className="modal-backdrop">
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <iframe
                            title="pdf"
                            src={`/assets/pdfs/${modalFile}`}
                            frameBorder="0"
                        ></iframe>
                    </div>
                </div>
            )}

        </div>
    );
}