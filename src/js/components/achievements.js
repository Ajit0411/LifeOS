/**
 * LifeOS Achievements Badge Component
 * Renders unlockable progress badges, locked greyscale states,
 * custom hover glows, and associated XP reward allocations.
 */

import { State } from "../state.js";

export function renderAchievements(container) {
    const state = State.state;

    // Map achievements cards
    const badgesHtml = state.achievements.map(badge => {
        const percent = Math.min(100, Math.round((badge.progress / badge.target) * 100));
        
        return `
            <div class="glass-card achievement-card ${badge.unlocked ? 'unlocked' : 'locked'}">
                <div class="badge-wrapper">
                    ${badge.unlocked ? badge.icon : '🔒'}
                </div>
                <div class="badge-title">${escapeHTML(badge.title)}</div>
                <div class="badge-desc">${escapeHTML(badge.desc)}</div>
                
                <div class="badge-progress-container">
                    <div class="badge-progress-bar-outer">
                        <div class="badge-progress-bar-inner" style="width: ${percent}%;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                        <span class="badge-progress-text">${badge.progress}/${badge.target}</span>
                        <span style="font-size: 10px; font-weight: 700; color: var(--color-cyan);">
                            <i class="fas fa-bolt"></i> +${badge.xp} XP
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div style="max-width: 1000px; margin: 0 auto;">
            <div class="section-header" style="margin-bottom: 24px;">
                <div>
                    <h3 style="font-size: 24px;"><i class="fas fa-trophy" style="color: var(--color-yellow);"></i> Hall of Achievements</h3>
                    <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Tackle objectives to unlock credentials and massive XP gains.</p>
                </div>
            </div>
            
            <div class="achievements-grid">
                ${badgesHtml}
            </div>
        </div>
    `;
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
