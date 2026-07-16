/**
 * LifeOS Master Application Bootstrapper
 * Initializes SPA router, binds state updates to layout gauges,
 * manages notification sliders, and controls global resets.
 */

import { State } from "./state.js";
import { Router } from "./router.js";
import { NotificationToasts } from "./components/notifications.js"; // boot toast listener

// Import page view renderers
import { renderDashboard } from "./components/dashboard.js";
import { renderTasks } from "./components/tasks.js";
import { renderSkillTree } from "./components/skilltree.js";
import { renderAnalytics } from "./components/analytics.js";
import { renderAchievements } from "./components/achievements.js";
import { renderLeaderboard } from "./components/leaderboard.js";
import { renderFocus } from "./components/focus.js";

// Metadata header descriptions for routes
const ROUTE_META = {
    dashboard: { title: "Command Center", desc: "Welcome back, Agent. Clear today's quests!" },
    tasks: { title: "Active Quests", desc: "Complete tasks to earn XP and level up." },
    skilltree: { title: "Skill Ascent", desc: "Follow the C++ & Software Engineering roadmap." },
    analytics: { title: "Performance Hub", desc: "Review study logs and completion statistics." },
    achievements: { title: "Achievements Vault", desc: "Collect badges for conquering high productivity milestones." },
    leaderboard: { title: "Obsidian League", desc: "Compete with other engineers on the weekly board." },
    focus: { title: "Focus Chamber", desc: "Drown distractions with the built-in ambient sound machine." }
};

// Initialize Application UI
document.addEventListener("DOMContentLoaded", () => {
    // 1. Setup SPA Router
    const router = new Router({
        _beforeRoute: (pageId) => {
            // Update Title and Subtitle dynamically in header
            const meta = ROUTE_META[pageId] || { title: "LifeOS", desc: "Gamified Productivity Engine" };
            document.getElementById("header-title-lbl").innerText = meta.title;
            document.getElementById("header-subtitle-lbl").innerText = meta.desc;
        },
        dashboard: (container) => renderDashboard(container),
        tasks: (container) => renderTasks(container),
        skilltree: (container) => renderSkillTree(container),
        analytics: (container) => renderAnalytics(container),
        achievements: (container) => renderAchievements(container),
        leaderboard: (container) => renderLeaderboard(container),
        focus: (container) => renderFocus(container)
    });

    // 2. Subscribe to State changes to keep header & sidebar in sync
    State.subscribe((state) => {
        updateGlobalGauges(state);
        updateNotificationsDrawer(state);
    });

    // 3. Render initial gauges on load
    State.notifyListeners();

    // 4. Hook up notification drawer toggles
    const btnNoti = document.getElementById("btn-noti-toggle");
    const drawer = document.getElementById("notifications-drawer");
    
    if (btnNoti && drawer) {
        btnNoti.addEventListener("click", (e) => {
            e.stopPropagation();
            drawer.classList.toggle("active");
        });

        // Click outside closes notification drawer
        document.addEventListener("click", (e) => {
            if (!drawer.contains(e.target) && e.target !== btnNoti && !btnNoti.contains(e.target)) {
                drawer.classList.remove("active");
            }
        });
    }

    // Clear notifications click trigger
    const btnClearNoti = document.getElementById("btn-noti-clear");
    if (btnClearNoti) {
        btnClearNoti.addEventListener("click", () => {
            State.clearNotifications();
        });
    }

    // Reset app state trigger button
    const btnReset = document.getElementById("btn-reset-app");
    if (btnReset) {
        btnReset.addEventListener("click", () => {
            if (confirm("WARNING: Are you sure you want to reset all your progress, tasks, and achievements? This cannot be undone.")) {
                localStorage.removeItem("lifeos_state");
                window.location.reload();
            }
        });
    }
});

// Update Header and Sidebar counters
function updateGlobalGauges(state) {
    const user = state.user;

    // Header gauges
    document.getElementById("header-lvl-val").innerText = user.level;
    document.getElementById("header-xp-val").innerText = user.xp;
    document.getElementById("header-xp-req").innerText = user.xpRequired;
    
    const xpPercent = Math.min(100, Math.round((user.xp / user.xpRequired) * 100));
    document.getElementById("header-xp-bar").style.width = `${xpPercent}%`;
    document.getElementById("header-streak-lbl").innerText = user.streak;

    // Sidebar gauges
    document.getElementById("sidebar-avatar-img").src = user.avatar;
    document.getElementById("sidebar-level-lbl").innerText = user.level;
    document.getElementById("sidebar-name-lbl").innerText = user.name;
}

// Update notifications list in drop down
function updateNotificationsDrawer(state) {
    const listContainer = document.getElementById("noti-list-container");
    const indicator = document.getElementById("noti-indicator");
    
    if (!listContainer) return;
    
    const list = state.notifications || [];
    
    // Toggle active notification indicator dot
    if (indicator) {
        indicator.style.display = list.length > 0 ? "block" : "none";
    }

    if (list.length === 0) {
        listContainer.innerHTML = `
            <div class="noti-empty">
                <i class="fas fa-bell-slash" style="font-size: 20px; display: block; margin-bottom: 8px; color: var(--text-muted);"></i>
                Inbox is empty
            </div>
        `;
        return;
    }

    listContainer.innerHTML = list.map(n => {
        let typeClass = "";
        let icon = "🔔";

        if (n.type === "level-up") {
            typeClass = "level-up";
            icon = "🏆";
        } else if (n.type === "achievement") {
            typeClass = "achievement";
            icon = "✨";
        } else if (n.type === "quest") {
            icon = "⚡";
        } else if (n.type === "undo") {
            icon = "🔄";
        } else if (n.type === "streak-break") {
            icon = "⚠️";
        }

        // Relative timestamp formatting (simplified)
        const timeStr = new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="noti-item ${typeClass}">
                <div style="font-size: 16px;">${icon}</div>
                <div>
                    <strong>${escapeHTML(n.title)}</strong>
                    <div style="color: var(--text-secondary); margin-top: 2px;">${escapeHTML(n.message)}</div>
                    <div class="noti-item-time">${timeStr}</div>
                </div>
            </div>
        `;
    }).join('');
}

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
