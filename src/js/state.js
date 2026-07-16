/**
 * LifeOS State Engine
 * Manages reactive application state, local storage persistence, 
 * XP formula calculations, and action undo history.
 */

class StateEngine {
    constructor() {
        this.listeners = [];
        this.history = [];
        this.loadState();
        
        // Check for daily resets on boot
        this.checkDailyReset();
    }

    // Default Initial State
    getInitialState() {
        return {
            user: {
                name: "Agent Prodigy",
                avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=LifeOSAgent",
                level: 1,
                xp: 0,
                xpRequired: 100, // Formula: level * 100
                streak: 0,
                lastActiveDate: new Date().toDateString(),
                lastProductiveDate: "",
                productivityScore: 0,
                totalTasksCompleted: 0,
                totalStudyHours: 0
            },
            tasks: [],
            quests: [
                { id: "q-1", title: "Focus Master: Complete a Pomodoro session", completed: false, progress: 0, target: 1, xp: 100, type: "focus" },
                { id: "q-2", title: "Task Slayer: Finish 3 tasks today", completed: false, progress: 0, target: 3, xp: 150, type: "tasks" },
                { id: "q-3", title: "Code Warrior: Complete a Skill Tree objective", completed: false, progress: 0, target: 1, xp: 200, type: "skills" }
            ],
            skills: [
                { 
                    id: "cpp", 
                    title: "C++ Fundamentals", 
                    desc: "Master memory allocation, pointers, references, and compiler basics.", 
                    status: "unlocked", // locked, unlocked, in_progress, completed
                    xpReward: 300,
                    objectives: [
                        { id: "cpp-1", text: "Master raw pointers & references", completed: false },
                        { id: "cpp-2", text: "Understand STL containers (Vector, Map, Set)", completed: false },
                        { id: "cpp-3", text: "Implement custom templates", completed: false }
                    ]
                },
                { 
                    id: "dsa", 
                    title: "Data Structures & Algorithms", 
                    desc: "Gain expertise in Trees, Graphs, Sorting, and Dynamic Programming.", 
                    status: "locked",
                    xpReward: 500,
                    objectives: [
                        { id: "dsa-1", text: "Implement a Binary Search Tree (BST)", completed: false },
                        { id: "dsa-2", text: "Learn BFS & DFS graph traversals", completed: false },
                        { id: "dsa-3", text: "Solve 10 Dynamic Programming challenges", completed: false }
                    ]
                },
                { 
                    id: "oop", 
                    title: "Object Oriented Design", 
                    desc: "Understand architectural patterns, SOLID principles, and clean inheritance.", 
                    status: "locked",
                    xpReward: 400,
                    objectives: [
                        { id: "oop-1", text: "Apply SOLID principles in a mini-project", completed: false },
                        { id: "oop-2", text: "Build Factory and Singleton patterns", completed: false },
                        { id: "oop-3", text: "Write clean interfaces & abstract classes", completed: false }
                    ]
                },
                { 
                    id: "projects", 
                    title: "Full-Stack Projects", 
                    desc: "Construct a multi-threaded server and developer dashboard.", 
                    status: "locked",
                    xpReward: 600,
                    objectives: [
                        { id: "proj-1", text: "Build a multi-threaded TCP web server", completed: false },
                        { id: "proj-2", text: "Integrate WebSocket notifications system", completed: false }
                    ]
                },
                { 
                    id: "internship", 
                    title: "Internship Preparation", 
                    desc: "Revise core OS/DBMS processes, polish resume, and conduct mock runs.", 
                    status: "locked",
                    xpReward: 800,
                    objectives: [
                        { id: "prep-1", text: "Complete 3 simulated tech interviews", completed: false },
                        { id: "prep-2", text: "Revise Operating Systems & Database topics", completed: false },
                        { id: "prep-3", text: "Deploy portfolio website & resume", completed: false }
                    ]
                }
            ],
            achievements: [],
            leaderboard: [
                { name: "Neo_Dev", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=neo", level: 14, xpThisWeek: 1450, isCurrentUser: false },
                { name: "CodeCrusader", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=crusader", level: 11, xpThisWeek: 1210, isCurrentUser: false },
                { name: "LofiHacker", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=lofi", level: 9, xpThisWeek: 980, isCurrentUser: false },
                { name: "Agent Prodigy", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=LifeOSAgent", level: 1, xpThisWeek: 0, isCurrentUser: true },
                { name: "NotionNerd", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=nerd", level: 6, xpThisWeek: 320, isCurrentUser: false },
                { name: "ZenCoder", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=zen", level: 5, xpThisWeek: 280, isCurrentUser: false }
            ],
            analytics: {
                weeklyCompletion: [0, 0, 0, 0, 0, 0, 0], // Mon - Sun completed tasks
                studyHours: [0, 0, 0, 0, 0, 0, 0],
                productivityScores: [0, 0, 0, 0, 0, 0, 0],
                heatmapHistory: {}
            },
            settings: {
                customFocusDuration: 25
            }
        };
    }

    // Populate Heatmap default data
    prepopulateHeatmap(analytics) {
        // No default heatmap data for new clean installations
    }

    // Load state from localStorage or initialize
    loadState() {
        const stored = localStorage.getItem("lifeos_state");
        if (stored) {
            try {
                this.state = JSON.parse(stored);
                // Backwards compatibility / Clean reset check:
                // If they have the old mock tasks or productivityScore is 78 (from previous run)
                // we clean it to make sure the user immediately sees the fresh installation stats.
                if (this.state.user.productivityScore === 78 || this.state.user.streak === 3) {
                    this.state = this.getInitialState();
                    this.saveState();
                }
            } catch (e) {
                console.error("Failed to parse stored state. Initializing fresh.", e);
                this.state = this.getInitialState();
                this.saveState();
            }
        } else {
            this.state = this.getInitialState();
            this.saveState();
        }
    }

    // Save current state to localStorage
    saveState() {
        localStorage.setItem("lifeos_state", JSON.stringify(this.state));
        this.notifyListeners();
    }

    // Reactivity system
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // Handle daily streak checks & quest resets
    checkDailyReset() {
        const todayStr = new Date().toDateString();
        const lastActive = this.state.user.lastActiveDate;

        if (lastActive !== todayStr) {
            const lastProd = this.state.user.lastProductiveDate;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();
            
            // Check if streak broken (no productive actions on consecutive days)
            if (lastProd && lastProd !== todayStr && lastProd !== yesterdayStr) {
                this.state.user.streak = 0;
                this.addNotification("Streak Broken", "You missed a productive day! Streak reset to 0.", "streak-break");
            }
            
            // Update last active
            this.state.user.lastActiveDate = todayStr;
            
            // Reset daily quests
            this.state.quests.forEach(q => {
                q.completed = false;
                q.progress = 0;
            });
            
            this.addNotification("Daily Quests Reset", "New daily quests are available. Conquer today!", "quest-reset");
            this.saveState();
        }
    }

    // Record Productive action to trigger streak increases
    recordProductiveAction() {
        const todayStr = new Date().toDateString();
        const lastProd = this.state.user.lastProductiveDate;
        
        if (!lastProd) {
            // First productive action ever
            this.state.user.streak = 1;
            this.state.user.lastProductiveDate = todayStr;
            this.addNotification("Streak Started!", "First productive step taken. Keep it up!", "quest");
            
            this.updateAchievementProgress("badge-streak", this.state.user.streak);
        } else if (lastProd !== todayStr) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();
            
            if (lastProd === yesterdayStr) {
                // Consecutive day
                this.state.user.streak++;
                this.state.user.lastProductiveDate = todayStr;
                this.addNotification("Streak Maintained!", `You're on a ${this.state.user.streak}-day streak! 🔥`, "quest");
                
                this.updateAchievementProgress("badge-streak", this.state.user.streak);
            } else {
                // Broke streak previously, starting a new one
                this.state.user.streak = 1;
                this.state.user.lastProductiveDate = todayStr;
                this.addNotification("Streak Restarted!", "New streak started. Consistency is key!", "quest");
                
                this.updateAchievementProgress("badge-streak", this.state.user.streak);
            }
        }
        
        // Ensure streak is synced on leaderboard
        const selfRoster = this.state.leaderboard.find(p => p.isCurrentUser);
        if (selfRoster) {
            selfRoster.level = this.state.user.level;
        }

        this.saveState();
    }

    // Set Custom Pomodoro Timer Settings
    setCustomFocusDuration(minutes) {
        if (!this.state.settings) {
            this.state.settings = {};
        }
        this.state.settings.customFocusDuration = minutes;
        this.saveState();
    }

    // XP Math & Leveling Engine
    gainXP(amount, reason = "") {
        let currentXP = this.state.user.xp + amount;
        let currentLevel = this.state.user.level;
        let requiredXP = currentLevel * 100;
        let leveledUp = false;

        while (currentXP >= requiredXP) {
            currentXP -= requiredXP;
            currentLevel++;
            requiredXP = currentLevel * 100;
            leveledUp = true;
        }

        this.state.user.xp = currentXP;
        this.state.user.level = currentLevel;
        this.state.user.xpRequired = requiredXP;

        // Sync leaderboard
        const selfRoster = this.state.leaderboard.find(p => p.isCurrentUser);
        if (selfRoster) {
            selfRoster.level = currentLevel;
            selfRoster.xpThisWeek += amount;
        }

        // Trigger float indicator event
        const floatEvent = new CustomEvent("xp-gained", { detail: { xp: amount } });
        window.dispatchEvent(floatEvent);

        if (leveledUp) {
            this.addNotification("Level Up!", `Congratulations! You reached Level ${currentLevel}!`, "level-up");
            
            // Audio cue (synthesized)
            this.playSynthesizedJingle("levelup");
            
            // Achievements check
            this.updateAchievementProgress("badge-level", currentLevel);
        } else {
            this.playSynthesizedJingle("xp");
        }

        this.saveState();
        return leveledUp;
    }

    // Task Operations
    addTask(title, priority, category) {
        const xpMap = { high: 50, medium: 30, low: 15 };
        const newTask = {
            id: "task-" + Date.now(),
            title: title || "Untitled Task",
            category: category || "General",
            priority: priority || "medium",
            completed: false,
            xp: xpMap[priority] || 30,
            createdAt: Date.now()
        };

        this.state.tasks.push(newTask);
        this.saveState();
        
        // Track task analytics
        this.updateProductivityScore();
        return newTask;
    }

    completeTask(id) {
        const task = this.state.tasks.find(t => t.id === id);
        if (task && !task.completed) {
            task.completed = true;
            task.completedAt = Date.now();
            
            // Award XP
            const leveledUp = this.gainXP(task.xp);
            
            // Record in undo history
            this.history.push({
                type: "complete-task",
                taskId: id,
                xpAwarded: task.xp,
                leveledUp: leveledUp
            });

            // Update stats
            this.state.user.totalTasksCompleted++;
            
            // Increment heat map
            const todayStr = new Date().toDateString();
            this.state.analytics.heatmapHistory[todayStr] = (this.state.analytics.heatmapHistory[todayStr] || 0) + 1;
            
            // Update daily tasks completed count
            const monToSunIndex = (new Date().getDay() + 6) % 7; // Mon is 0
            this.state.analytics.weeklyCompletion[monToSunIndex]++;

            // Update daily quest progress
            this.updateQuestProgress("tasks", 1);
            
            // Update achievement progress
            this.updateAchievementProgress("badge-tasks", this.state.user.totalTasksCompleted);

            // Record productive action for consecutive streaks
            this.recordProductiveAction();

            this.updateProductivityScore();
            this.saveState();
            
            // Trigger UI notifications
            this.addNotification("Task Completed", `Completed: "${task.title}". +${task.xp} XP!`, "quest");
        }
    }

    deleteTask(id) {
        const task = this.state.tasks.find(t => t.id === id);
        if (task) {
            this.state.tasks = this.state.tasks.filter(t => t.id !== id);
            this.saveState();
            this.updateProductivityScore();
        }
    }

    undoLastAction() {
        if (this.history.length === 0) return false;
        
        const lastAction = this.history.pop();
        if (lastAction.type === "complete-task") {
            const task = this.state.tasks.find(t => t.id === lastAction.taskId);
            if (task && task.completed) {
                task.completed = false;
                delete task.completedAt;

                // Revert XP
                let currentXP = this.state.user.xp - lastAction.xpAwarded;
                if (currentXP < 0) {
                    if (this.state.user.level > 1) {
                        this.state.user.level--;
                        this.state.user.xpRequired = this.state.user.level * 100;
                        currentXP += this.state.user.xpRequired;
                    } else {
                        currentXP = 0;
                    }
                }
                this.state.user.xp = currentXP;
                
                // Revert metrics
                this.state.user.totalTasksCompleted = Math.max(0, this.state.user.totalTasksCompleted - 1);
                
                const todayStr = new Date().toDateString();
                if (this.state.analytics.heatmapHistory[todayStr]) {
                    this.state.analytics.heatmapHistory[todayStr] = Math.max(0, this.state.analytics.heatmapHistory[todayStr] - 1);
                }

                const monToSunIndex = (new Date().getDay() + 6) % 7;
                this.state.analytics.weeklyCompletion[monToSunIndex] = Math.max(0, this.state.analytics.weeklyCompletion[monToSunIndex] - 1);
                
                // Revert quest progress
                const taskQuest = this.state.quests.find(q => q.type === "tasks");
                if (taskQuest && taskQuest.progress > 0) {
                    taskQuest.progress--;
                    taskQuest.completed = false;
                }

                // Sync leaderboard
                const selfRoster = this.state.leaderboard.find(p => p.isCurrentUser);
                if (selfRoster) {
                    selfRoster.level = this.state.user.level;
                    selfRoster.xpThisWeek = Math.max(0, selfRoster.xpThisWeek - lastAction.xpAwarded);
                }

                this.updateProductivityScore();
                this.saveState();
                
                this.addNotification("Action Undone", `Reverted task completion: "${task.title}"`, "undo");
                return true;
            }
        }
        return false;
    }

    // Quests Engine
    updateQuestProgress(type, amount) {
        this.state.quests.forEach(q => {
            if (q.type === type && !q.completed) {
                q.progress = Math.min(q.target, q.progress + amount);
                if (q.progress >= q.target) {
                    q.completed = true;
                    this.gainXP(q.xp);
                    this.addNotification("Quest Finished", `Completed Daily Quest: "${q.title}" (+${q.xp} XP)`, "quest");
                }
            }
        });
        this.saveState();
    }

    // Achievements Tracker
    updateAchievementProgress(id, progressVal) {
        const achievement = this.state.achievements.find(a => a.id === id);
        if (achievement && !achievement.unlocked) {
            achievement.progress = Math.min(achievement.target, progressVal);
            if (achievement.progress >= achievement.target) {
                achievement.unlocked = true;
                this.gainXP(achievement.xp);
                this.addNotification("Achievement Unlocked!", `Badge Earned: "${achievement.title}" (+${achievement.xp} XP)`, "achievement");
                this.playSynthesizedJingle("achievement");
            }
        }
        this.saveState();
    }

    // Skill Tree Actions
    toggleObjective(nodeId, objectiveId) {
        const skill = this.state.skills.find(s => s.id === nodeId);
        if (skill && skill.status !== "locked") {
            const objective = skill.objectives.find(o => o.id === objectiveId);
            if (objective) {
                objective.completed = !objective.completed;
                
                if (objective.completed) {
                    // Reward minor XP (15 XP per objective completed)
                    this.gainXP(15);
                    this.updateQuestProgress("skills", 1);
                    this.recordProductiveAction();
                } else {
                    // Deduct minor XP
                    this.gainXP(-15);
                }

                // Check if skill should go In Progress
                const completedCount = skill.objectives.filter(o => o.completed).length;
                if (completedCount === skill.objectives.length) {
                    // Fully completed!
                    skill.status = "completed";
                    this.gainXP(skill.xpReward);
                    this.addNotification("Skill Mastered!", `Mastered the module: "${skill.title}" (+${skill.xpReward} XP)`, "achievement");
                    
                    // Unlock next node in graph sequence
                    this.unlockNextNode(nodeId);

                    // Update badge progress
                    const completedSkillsCount = this.state.skills.filter(s => s.status === "completed").length;
                    this.updateAchievementProgress("badge-skills", completedSkillsCount);
                } else if (completedCount > 0) {
                    skill.status = "in_progress";
                } else {
                    skill.status = "unlocked";
                }

                this.updateProductivityScore();
                this.saveState();
            }
        }
    }

    unlockNextNode(nodeId) {
        const sequence = ["cpp", "dsa", "oop", "projects", "internship"];
        const currentIndex = sequence.indexOf(nodeId);
        if (currentIndex !== -1 && currentIndex + 1 < sequence.length) {
            const nextNodeId = sequence[currentIndex + 1];
            const nextNode = this.state.skills.find(s => s.id === nextNodeId);
            if (nextNode && nextNode.status === "locked") {
                nextNode.status = "unlocked";
                this.addNotification("New Skill Unlocked", `You can now study: "${nextNode.title}"!`, "quest");
            }
        }
    }

    completeSkillNodeDirectly(nodeId) {
        const skill = this.state.skills.find(s => s.id === nodeId);
        if (skill && skill.status !== "locked" && skill.status !== "completed") {
            skill.objectives.forEach(o => o.completed = true);
            skill.status = "completed";
            
            this.gainXP(skill.xpReward);
            this.addNotification("Skill Mastered!", `Mastered the module: "${skill.title}" (+${skill.xpReward} XP)`, "achievement");
            
            this.unlockNextNode(nodeId);

            const completedSkillsCount = this.state.skills.filter(s => s.status === "completed").length;
            this.updateAchievementProgress("badge-skills", completedSkillsCount);

            this.recordProductiveAction();

            this.updateProductivityScore();
            this.saveState();
        }
    }

    // Pomodoro Timer Logging
    logFocusSession(minutes, soundUsed) {
        // Increment study hours
        const hourGain = parseFloat((minutes / 60).toFixed(2));
        this.state.user.totalStudyHours = parseFloat((this.state.user.totalStudyHours + hourGain).toFixed(2));
        
        const monToSunIndex = (new Date().getDay() + 6) % 7;
        this.state.analytics.studyHours[monToSunIndex] = parseFloat((this.state.analytics.studyHours[monToSunIndex] + hourGain).toFixed(2));
        
        // Award focus XP (5 XP per minute)
        const xpGain = minutes * 5;
        this.gainXP(xpGain);

        // Update focus quest
        this.updateQuestProgress("focus", 1);

        // Track badge progress
        const currentDeepBadge = this.state.achievements.find(a => a.id === "badge-focus");
        if (currentDeepBadge) {
            this.updateAchievementProgress("badge-focus", currentDeepBadge.progress + 1);
        }

        this.recordProductiveAction();

        this.updateProductivityScore();
        this.saveState();

        this.addNotification("Focus Session Logged", `Completed a ${minutes}m focus session! +${xpGain} XP!`, "quest");
    }

    // Productivity Score Algorithm
    updateProductivityScore() {
        // Calculation is based on: 
        // 1. Completion ratio of active tasks (40%)
        // 2. Weekly tasks count relative to standard (30%)
        // 3. Study Hours logged relative to standard (30%)
        const total = this.state.tasks.length;
        const completed = this.state.tasks.filter(t => t.completed).length;
        const completionRate = total > 0 ? (completed / total) * 100 : 80;

        const studyHours = this.state.user.totalStudyHours;
        const hoursTarget = 15; // 15 hrs weekly goal
        const hoursScore = Math.min(100, (studyHours / hoursTarget) * 100);

        const totalCompletedScore = Math.min(100, (this.state.user.totalTasksCompleted / 20) * 100);

        const score = Math.round((completionRate * 0.4) + (totalCompletedScore * 0.3) + (hoursScore * 0.3));
        this.state.user.productivityScore = Math.max(10, Math.min(99, score));

        // Update score array index
        const monToSunIndex = (new Date().getDay() + 6) % 7;
        this.state.analytics.productivityScores[monToSunIndex] = this.state.user.productivityScore;
    }

    // Dynamic Mock Leaderboard Engine
    simulateLeaderboardActivity() {
        this.state.leaderboard.forEach(user => {
            if (!user.isCurrentUser) {
                // 30% chance they score some XP
                if (Math.random() < 0.35) {
                    const gain = Math.floor(Math.random() * 80) + 20;
                    user.xpThisWeek += gain;
                    // Check level ups
                    if (user.xpThisWeek % 600 < 50) {
                        user.level++;
                    }
                }
            }
        });
        
        // Re-sort leaderboard
        this.state.leaderboard.sort((a, b) => b.xpThisWeek - a.xpThisWeek);
        this.saveState();
    }

    // Notifications Management
    addNotification(title, message, type = "quest") {
        if (!this.state.notifications) {
            this.state.notifications = [];
        }

        const newNoti = {
            id: "noti-" + Date.now() + Math.random().toString(36).substr(2, 5),
            title,
            message,
            type, // level-up, achievement, quest, undo
            timestamp: Date.now()
        };

        this.state.notifications.unshift(newNoti);
        
        // Keep list to max 15
        if (this.state.notifications.length > 15) {
            this.state.notifications.pop();
        }

        // Trigger custom UI notification toast event
        const toastEvent = new CustomEvent("new-toast", { detail: newNoti });
        window.dispatchEvent(toastEvent);

        this.saveState();
    }

    clearNotifications() {
        this.state.notifications = [];
        this.saveState();
    }

    // Web Audio Synthesizer Engine
    playSynthesizedJingle(type) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            if (type === "xp") {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
                osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5
                
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } 
            else if (type === "levelup") {
                // Chord progression: C5 -> E5 -> G5 -> C6
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
                    
                    gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.3);
                    
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + idx * 0.08);
                    osc.stop(ctx.currentTime + idx * 0.08 + 0.35);
                });
            }
            else if (type === "achievement") {
                const notes = [392.00, 523.25, 659.25, 783.99, 987.77, 1046.50]; // G4, C5, E5, G5, B5, C6
                notes.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = "sawtooth";
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
                    
                    gain.gain.setValueAtTime(0.04, ctx.currentTime + idx * 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.25);
                    
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + idx * 0.05);
                    osc.stop(ctx.currentTime + idx * 0.05 + 0.3);
                });
            }
        } catch (e) {
            console.warn("Audio Context synthesis blocked or unsupported.", e);
        }
    }
}

// Singleton state instance
export const State = new StateEngine();
