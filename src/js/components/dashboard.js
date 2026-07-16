/**
 * LifeOS Dashboard Page Component
 * Renders the primary landing view containing progress stats,
 * today's quests, quick task actions, and Pomodoro integrations.
 */

import { State } from "../state.js";

const QUOTES = [
    "Procrastination is the thief of time. Collar him.",
    "The secret of getting ahead is getting started.",
    "You don't have to be great to start, but you have to start to be great.",
    "Your future is created by what you do today, not tomorrow.",
    "Action is the foundational key to all success.",
    "Do something today that your future self will thank you for."
];

export function renderDashboard(container) {
    const state = State.state || {};
    const user = state.user || { name: "Agent Prodigy", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=LifeOSAgent", level: 1, xp: 0, xpRequired: 100, streak: 0, productivityScore: 0, totalTasksCompleted: 0, totalStudyHours: 0 };
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    
    // Check if next skill exists
    const nextSkill = (state.skills && state.skills.length > 0) ? (state.skills.find(s => s.status === "unlocked" || s.status === "in_progress") || state.skills[state.skills.length - 1]) : null;

    // Build today's quests HTML
    const questsHtml = (state.quests && Array.isArray(state.quests)) ? state.quests.map(q => {
        return `
            <div class="quest-item ${q.completed ? 'completed' : ''}">
                <div class="quest-left">
                    <div class="quest-checkbox-mock">
                        ${q.completed ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    <div class="quest-details">
                        <div class="quest-title">${q.title}</div>
                        <div class="quest-reward"><i class="fas fa-bolt"></i> +${q.xp} XP</div>
                    </div>
                </div>
                <div class="badge-progress-text" style="font-size: 11px;">
                    ${q.progress}/${q.target}
                </div>
            </div>
        `;
    }).join('') : '';

    container.innerHTML = `
        <div class="dashboard-grid">
            <!-- Left Side: Main Widgets -->
            <div class="dashboard-main">
                
                <!-- Welcome Banner -->
                <div class="welcome-hero">
                    <h2>Welcome Back, ${user.name}</h2>
                    <p>Level up your life, defeat procrastination, and master your goals. Every task you finish brings you closer to your dreams.</p>
                    <div class="motivational-quote">
                        <i class="fas fa-quote-left"></i>
                        <span>"${randomQuote}"</span>
                    </div>
                </div>

                <!-- Three Stat Cards -->
                <div class="stats-cards-row">
                    <div class="glass-card">
                        <div class="stat-card-label">Productivity Score</div>
                        <div class="stat-card-value" style="color: var(--color-cyan); text-shadow: var(--cyan-glow);">
                            ${user.productivityScore}%
                        </div>
                        <div class="stat-card-sub cyan">
                            <i class="fas fa-arrow-up"></i> Optimal Efficiency
                        </div>
                    </div>
                    <div class="glass-card">
                        <div class="stat-card-label">Streak Status</div>
                        <div class="stat-card-value" style="color: var(--color-red); text-shadow: var(--red-glow); display: flex; align-items: center; gap: 8px;">
                            ${user.streak} Days <i class="fas fa-fire streak-fire-icon"></i>
                        </div>
                        <div class="stat-card-sub text-danger" style="color: var(--color-red);">
                            Don't break the flame!
                        </div>
                    </div>
                    <div class="glass-card">
                        <div class="stat-card-label">Completed Tasks</div>
                        <div class="stat-card-value" style="color: var(--color-green); text-shadow: var(--green-glow);">
                            ${user.totalTasksCompleted}
                        </div>
                        <div class="stat-card-sub green">
                            <i class="fas fa-check-double"></i> All Time Log
                        </div>
                    </div>
                </div>

                <!-- Today's Quests -->
                <div class="glass-card">
                    <div class="section-header">
                        <h3><i class="fas fa-bullseye"></i> Today's Quests</h3>
                        <a href="#tasks" class="section-link">View Tasks <i class="fas fa-arrow-right"></i></a>
                    </div>
                    <div class="quest-list">
                        ${questsHtml || '<div class="noti-empty">No daily quests loaded</div>'}
                    </div>
                </div>
            </div>

            <!-- Right Side: Sidebar Widgets -->
            <div class="dashboard-sidebar">
                
                <!-- Profile Progress Card -->
                <div class="glass-card progress-card">
                    <div class="profile-avatar-large">
                        <img src="${user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=LifeOSAgent'}" alt="Avatar">
                        <div class="level-badge-large">LVL ${user.level}</div>
                    </div>
                    <h3>${user.name}</h3>
                    <div class="profile-rank">Code Apprentice</div>
                    
                    <div style="width: 100%; text-align: left; margin-bottom: 12px;">
                        <div class="xp-label-row">
                            <span>Experience Points</span>
                            <span class="xp-val">${user.xp}/${user.xpRequired} XP</span>
                        </div>
                        <div class="xp-bar-outer" style="margin-top: 6px;">
                            <div class="xp-bar-inner" style="width: ${user.xpRequired > 0 ? (user.xp / user.xpRequired) * 100 : 0}%;"></div>
                        </div>
                    </div>

                    <div class="progress-metric-row">
                        <div class="metric-box">
                            <div class="metric-title">Study Hours</div>
                            <div class="metric-val" style="color: var(--color-purple); text-shadow: var(--purple-glow);">${user.totalStudyHours}h</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-title">Total XP</div>
                            <div class="metric-val" style="color: var(--color-cyan); text-shadow: var(--cyan-glow);">${user.level * 100 + user.xp - 100}</div>
                        </div>
                    </div>
                </div>

                <!-- Next Up Skill Card -->
                ${nextSkill ? `
                <div class="glass-card next-skill-card">
                    <div class="next-skill-header">Recommended Skill Node</div>
                    <div class="next-skill-title">${nextSkill.title}</div>
                    <div class="next-skill-desc">${nextSkill.desc ? nextSkill.desc.substring(0, 75) + '...' : ''}</div>
                    <button class="btn-learn-next" id="dash-btn-learn">
                        Study Module <i class="fas fa-graduation-cap"></i>
                    </button>
                </div>
                ` : ''}

                <!-- Quick Focus Widget -->
                <div class="glass-card pomo-widget">
                    <div class="next-skill-header" style="color: var(--color-purple);">Focus Hub</div>
                    <div class="pomo-widget-body" style="margin-top: 8px;">
                        <div>
                            <div class="next-skill-title" style="margin-bottom: 2px;">Pomodoro Zone</div>
                            <div class="pomo-widget-time">25:00</div>
                        </div>
                        <button class="pomo-widget-btn" id="dash-btn-focus">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Hook listeners
    const btnLearn = container.querySelector("#dash-btn-learn");
    if (btnLearn) {
        btnLearn.addEventListener("click", () => {
            window.location.hash = "#skilltree";
        });
    }

    const btnFocus = container.querySelector("#dash-btn-focus");
    if (btnFocus) {
        btnFocus.addEventListener("click", () => {
            window.location.hash = "#focus";
        });
    }
}
