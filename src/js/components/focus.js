/**
 * LifeOS Focus Mode & Synthesizer Component
 * Integrates Pomodoro timer controls, dynamic canvas countdown graphics,
 * focus task selectors, cyberpunk quotation tickers, and an offline
 * Web Audio ambient sound synthesizer (Rain, Binaural Beats, Space Drone).
 */

import { State } from "../state.js";

// Timer state (persisted across tab switches)
let timerSeconds = 25 * 60;
let timerTotal = 25 * 60;
let timerMode = "work"; // work, short_break, long_break
let timerInterval = null;
let timerRunning = false;

// Audio Synthesizer State
let audioCtx = null;
let synthNodes = []; // store active web audio node references
let activeSynthType = null; // rain, binaural, space_drone

const FOCUS_QUOTES = [
    "Focus is a muscle, and you are building it right now.",
    "Deep work is the superpower of the 21st century.",
    "Stay in the zone. The world can wait.",
    "Do one thing at a time, and do it with your whole soul.",
    "Put your energy into the task. Silence the noise.",
    "One session of deep focus outperforms a week of multitasking."
];

export function renderFocus(container) {
    const state = State.state;
    const currentQuote = FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)];

    // Sync from persisted settings if timer is not running
    if (!timerRunning) {
        const customMinutes = state.settings?.customFocusDuration || 25;
        if (timerMode === "work") {
            timerTotal = customMinutes * 60;
            timerSeconds = timerTotal;
        }
    }

    // Build task list option list
    const activeTasks = state.tasks.filter(t => !t.completed);
    const taskOptions = activeTasks.map(t => {
        return `<option value="${t.id}">${escapeHTML(t.title)} (${t.priority} priority)</option>`;
    }).join('');

    container.innerHTML = `
        <div class="focus-container">
            <!-- Focus Header -->
            <div class="focus-header">
                <h2>Deep Focus Chamber</h2>
                <p>Mute notifications, close social tabs, and dive into productive flow.</p>
            </div>

            <!-- Focus Tab selector -->
            <div class="focus-modes-bar">
                <button class="focus-mode-tab ${timerMode === 'work' ? 'active' : ''}" data-mode="work" data-time="${state.settings?.customFocusDuration ? state.settings.customFocusDuration * 60 : 1500}">Focus Session (${state.settings?.customFocusDuration || 25}m)</button>
                <button class="focus-mode-tab ${timerMode === 'short_break' ? 'active' : ''}" data-mode="short_break" data-time="300">Short Break (5m)</button>
                <button class="focus-mode-tab ${timerMode === 'long_break' ? 'active' : ''}" data-mode="long_break" data-time="900">Long Break (15m)</button>
            </div>

            <!-- Pomodoro Radial Ring Display -->
            <div class="timer-radial-wrapper">
                <canvas class="timer-radial-canvas" id="timer-canvas" width="280" height="280"></canvas>
                <div class="timer-digits" id="timer-readout">${formatTime(timerSeconds)}</div>
            </div>

            <!-- Controls row -->
            <div class="timer-controls-row">
                <button class="btn-timer-primary" id="btn-timer-toggle">
                    ${timerRunning ? '<i class="fas fa-pause"></i> Pause' : '<i class="fas fa-play"></i> Start Flow'}
                </button>
                <button class="btn-timer-secondary" id="btn-timer-reset" title="Reset Session">
                    <i class="fas fa-redo"></i>
                </button>
            </div>

            <!-- Custom Timer Input Panel -->
            <div class="glass-card focus-task-card" style="margin-top: 10px; display: flex; align-items: center; justify-content: space-between; gap: 14px; width: 100%; max-width: 500px;">
                <div style="flex-grow: 1;">
                    <label for="custom-timer-input">Custom Focus Duration</label>
                    <div style="display: flex; gap: 10px; margin-top: 6px;">
                        <input type="number" id="custom-timer-input" min="1" max="180" value="${state.settings?.customFocusDuration || 25}" 
                               style="flex-grow: 1; padding: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: #fff; border-radius: 8px; outline: none; font-size: 14px;">
                        <button class="btn-timer-primary" id="btn-set-custom-time" style="padding: 10px 20px; font-size: 13px; font-weight: 700; border-radius: 8px; margin: 0; box-shadow: none;">
                            Set Time
                        </button>
                    </div>
                </div>
            </div>

            <!-- Focus Task Selector -->
            <div class="glass-card focus-task-card">
                <label for="focus-task-select">Focus Target</label>
                <select id="focus-task-select" class="focus-task-select">
                    <option value="">-- General Productivity Focus --</option>
                    ${taskOptions}
                </select>
            </div>

            <!-- Sound Machine Synthesizer Panel -->
            <div class="glass-card sound-panel-card">
                <h4><i class="fas fa-headphones" style="color: var(--color-cyan);"></i> Binaural Synthesizer</h4>
                <div class="sound-options-row">
                    <button class="sound-toggle-btn ${activeSynthType === 'rain' ? 'active' : ''}" data-sound="rain">
                        <i class="fas fa-cloud-showers-heavy"></i>
                        <span>Pink Rain</span>
                    </button>
                    <button class="sound-toggle-btn ${activeSynthType === 'binaural' ? 'active' : ''}" data-sound="binaural">
                        <i class="fas fa-wave-square"></i>
                        <span>Theta Waves</span>
                    </button>
                    <button class="sound-toggle-btn ${activeSynthType === 'space_drone' ? 'active' : ''}" data-sound="space_drone">
                        <i class="fas fa-user-astronaut"></i>
                        <span>Cyber Drone</span>
                    </button>
                </div>
            </div>

            <!-- Quote slider ticker -->
            <div class="focus-quote-box">
                "${currentQuote}"
            </div>
        </div>
    `;

    // Initialize timer canvas drawing
    updateTimerCanvas(container);

    // Timer Mode Tab listeners
    container.querySelectorAll(".focus-mode-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            if (timerRunning) {
                if (!confirm("Stop current running focus session?")) return;
            }
            stopTimerLoop();
            timerMode = tab.getAttribute("data-mode");
            timerTotal = parseInt(tab.getAttribute("data-time"), 10);
            timerSeconds = timerTotal;
            
            // Re-render
            renderFocus(container);
        });
    });

    // Start/Pause click listener
    const btnToggle = container.querySelector("#btn-timer-toggle");
    if (btnToggle) {
        btnToggle.addEventListener("click", () => {
            if (timerRunning) {
                stopTimerLoop();
            } else {
                startTimerLoop(container);
            }
            renderFocus(container);
        });
    }

    // Reset click listener
    const btnReset = container.querySelector("#btn-timer-reset");
    if (btnReset) {
        btnReset.addEventListener("click", () => {
            stopTimerLoop();
            timerSeconds = timerTotal;
            renderFocus(container);
        });
    }

    // Custom Focus Time click listener
    const btnSetCustomTime = container.querySelector("#btn-set-custom-time");
    if (btnSetCustomTime) {
        btnSetCustomTime.addEventListener("click", () => {
            const input = container.querySelector("#custom-timer-input");
            if (input) {
                const minutes = parseInt(input.value, 10);
                if (isNaN(minutes) || minutes < 1 || minutes > 180) {
                    alert("Please enter a valid focus duration between 1 and 180 minutes.");
                    return;
                }

                stopTimerLoop();
                State.setCustomFocusDuration(minutes);
                
                timerMode = "work";
                timerTotal = minutes * 60;
                timerSeconds = timerTotal;

                renderFocus(container);
            }
        });
    }

    // Sound Machine click listeners
    container.querySelectorAll(".sound-toggle-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const soundType = btn.getAttribute("data-sound");
            toggleSynthesizer(soundType);
            renderFocus(container);
        });
    });
}

function startTimerLoop(container) {
    timerRunning = true;
    timerInterval = setInterval(() => {
        timerSeconds--;
        
        // Update digit text directly in DOM for performance
        const readout = container.querySelector("#timer-readout");
        if (readout) readout.innerText = formatTime(timerSeconds);

        updateTimerCanvas(container);

        if (timerSeconds <= 0) {
            handleTimerExpiry();
        }
    }, 1000);
}

function stopTimerLoop() {
    timerRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function handleTimerExpiry() {
    stopTimerLoop();

    // Visual trigger & audio synthesized cue
    State.playSynthesizedJingle("levelup");
    
    if (timerMode === "work") {
        const loggedMinutes = Math.round(timerTotal / 60);
        
        // Log focus in state
        State.logFocusSession(loggedMinutes, activeSynthType || "none");
        
        // Check if focused task was selected
        const selectElement = document.getElementById("focus-task-select");
        if (selectElement && selectElement.value) {
            const taskId = selectElement.value;
            State.completeTask(taskId);
        }

        alert("Focus session complete! Take a break.");
        timerMode = "short_break";
        timerTotal = 5 * 60;
        timerSeconds = timerTotal;
    } else {
        alert("Break complete! Ready to lock back in?");
        timerMode = "work";
        timerTotal = 25 * 60;
        timerSeconds = timerTotal;
    }

    // Redirect to redraw screen
    const focusView = document.getElementById("view-focus");
    if (focusView && focusView.classList.contains("active")) {
        renderFocus(focusView);
    }
}

// Canvas-based radial Pomodoro countdown circle
function updateTimerCanvas(container) {
    const canvas = container.querySelector("#timer-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;

    // Clear previous drawing
    ctx.clearRect(0, 0, size, size);

    // Track width / colors
    ctx.lineWidth = 8;
    ctx.lineCap = "round";

    // 1. Draw background ring
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // 2. Draw progress ring
    const ratio = timerSeconds / timerTotal;
    const angle = 2 * Math.PI * ratio;
    
    // Gradient coloring depending on mode
    const grad = ctx.createLinearGradient(0, 0, size, size);
    if (timerMode === "work") {
        grad.addColorStop(0, "#00f0ff");
        grad.addColorStop(1, "#bd00ff");
    } else {
        grad.addColorStop(0, "#00ff66");
        grad.addColorStop(1, "#00f0ff");
    }

    ctx.strokeStyle = grad;
    ctx.shadowBlur = timerRunning ? 10 : 0;
    ctx.shadowColor = timerMode === "work" ? "#00f0ff" : "#00ff66";
    
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, angle);
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;
}

// Formatting minutes:seconds
function formatTime(totalSecs) {
    const m = Math.floor(totalSecs / 60).toString().padStart(2, "0");
    const s = (totalSecs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

// ==========================================================================
// Native Web Audio Synthesizer (Zero Assets Audio Engine)
// ==========================================================================
function toggleSynthesizer(type) {
    if (activeSynthType === type) {
        // Turning off
        stopSynthesizer();
        activeSynthType = null;
    } else {
        // Turning on or switching
        stopSynthesizer();
        startSynthesizer(type);
        activeSynthType = type;
    }
}

function startSynthesizer(type) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        audioCtx = new AudioContext();
        
        if (type === "rain") {
            // Generate Pink Rain/Noise (using lowpass-filtered white noise)
            const bufferSize = 2 * audioCtx.sampleRate;
            const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            // Generate white noise array
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;

            // Lowpass filter to make it sound like gentle rain
            const filter = audioCtx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.value = 650; // low frequency cut

            // Volume gain node
            const gainNode = audioCtx.createGain();
            gainNode.gain.value = 0.35; // gentle ambient level

            // Connect graph
            noiseSource.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            noiseSource.start();
            
            synthNodes.push(noiseSource, filter, gainNode);
        }
        else if (type === "binaural") {
            // Theta wave entrainment (left ear 100Hz, right ear 104Hz -> 4Hz brainwave)
            const oscL = audioCtx.createOscillator();
            oscL.frequency.value = 100;
            
            const oscR = audioCtx.createOscillator();
            oscR.frequency.value = 104;

            const pannerL = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
            const pannerR = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;

            const gainL = audioCtx.createGain();
            const gainR = audioCtx.createGain();
            
            // Lower volume for comfortable binaural listening
            gainL.gain.value = 0.08;
            gainR.gain.value = 0.08;

            if (pannerL && pannerR) {
                pannerL.pan.value = -1;
                pannerR.pan.value = 1;

                oscL.connect(pannerL).connect(gainL).connect(audioCtx.destination);
                oscR.connect(pannerR).connect(gainR).connect(audioCtx.destination);
                
                synthNodes.push(oscL, oscR, pannerL, pannerR, gainL, gainR);
            } else {
                // Fallback if panner is not supported
                oscL.connect(gainL).connect(audioCtx.destination);
                oscR.connect(gainR).connect(audioCtx.destination);
                synthNodes.push(oscL, oscR, gainL, gainR);
            }

            oscL.start();
            oscR.start();
        }
        else if (type === "space_drone") {
            // Slow modulating cyberpunk synthetic drone
            const osc1 = audioCtx.createOscillator();
            osc1.type = "sawtooth";
            osc1.frequency.value = 55; // low A1 note
            
            const osc2 = audioCtx.createOscillator();
            osc2.type = "triangle";
            osc2.frequency.value = 55.5; // slight frequency detuning

            const filter = audioCtx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.value = 110;

            // LFO to slowly sweep filter cutoff (0.15Hz rate)
            const lfo = audioCtx.createOscillator();
            lfo.frequency.value = 0.15;

            const lfoGain = audioCtx.createGain();
            lfoGain.gain.value = 45; // mod depth

            const gainNode = audioCtx.createGain();
            gainNode.gain.value = 0.15;

            // Connect MODULATION path
            lfo.connect(lfoGain).connect(filter.frequency);
            
            // Connect AUDIO path
            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            lfo.start();
            osc1.start();
            osc2.start();

            synthNodes.push(osc1, osc2, lfo, lfoGain, filter, gainNode);
        }
    } catch (e) {
        console.warn("Web audio context creation was blocked or is unsupported by browser settings.", e);
    }
}

function stopSynthesizer() {
    synthNodes.forEach(node => {
        try {
            node.stop();
        } catch (e) {}
    });
    synthNodes = [];
    
    if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
    }
}

// Cleanup active synthesizers on routing window changes
window.addEventListener("hashchange", () => {
    const hash = window.location.hash || "#dashboard";
    if (hash !== "#focus") {
        stopSynthesizer();
        activeSynthType = null;
    }
});

// Utility: escape HTML entities
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
