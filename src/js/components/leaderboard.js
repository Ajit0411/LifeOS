/**
 * LifeOS Competitive Leaderboard Component
 * Renders the Duolingo-inspired league rosters, user placement,
 * promotional league rule cards, and countdown timers.
 */

import { State } from "../state.js";

export function renderLeaderboard(container) {
    const state = State.state;

    // Simulate opponent movement when visiting the leaderboard
    // to give it a "live competition" feeling
    State.simulateLeaderboardActivity();

    // Map list items
    const rankListHtml = state.leaderboard.map((player, index) => {
        const rank = index + 1;
        let rankClass = "";
        if (rank === 1) rankClass = "top-1";
        else if (rank === 2) rankClass = "top-2";
        else if (rank === 3) rankClass = "top-3";

        return `
            <div class="leaderboard-item ${player.isCurrentUser ? 'current-user' : ''}">
                <div class="leaderboard-rank ${rankClass}">${rank}</div>
                <div class="leaderboard-profile-cell">
                    <img src="${player.avatar}" class="leaderboard-avatar" alt="Avatar">
                    <span class="leaderboard-name">${escapeHTML(player.name)} ${player.isCurrentUser ? '(You)' : ''}</span>
                </div>
                <div class="leaderboard-xp-cell">${player.xpThisWeek} XP</div>
                <div class="leaderboard-level-cell">Lvl ${player.level}</div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="leaderboard-layout">
            
            <!-- Left Side: League Shield Display -->
            <div class="glass-card league-display-card">
                <div class="league-shield">🏆</div>
                <div class="league-title" style="background: linear-gradient(135deg, #ffd700 0%, #ff8800 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                    Obsidian League
                </div>
                <div class="league-season-timer" id="leaderboard-season-timer">
                    Season Ends: 2d 05h 12m 44s
                </div>
                
                <div class="league-rules">
                    <div class="rule-item">
                        <i class="fas fa-arrow-circle-up"></i>
                        <span>Top 3 promote to Champion League</span>
                    </div>
                    <div class="rule-item" style="color: var(--color-red);">
                        <i class="fas fa-arrow-circle-down"></i>
                        <span>Bottom 5 demote to Gold League</span>
                    </div>
                    <div class="rule-item">
                        <i class="fas fa-award"></i>
                        <span>1st place gets +500 XP bonus chest</span>
                    </div>
                </div>
            </div>

            <!-- Right Side: Roster Table -->
            <div class="glass-card leaderboard-table-card">
                <div class="leaderboard-headers">
                    <span>Rank</span>
                    <span>User Profile</span>
                    <span>Weekly Score</span>
                    <span>Rank Level</span>
                </div>
                <div class="rank-list-items">
                    ${rankListHtml}
                </div>
            </div>

        </div>
    `;

    // Start live countdown timer for the league
    startLeagueTimer(container.querySelector("#leaderboard-season-timer"));
}

function startLeagueTimer(timerElement) {
    if (!timerElement) return;
    
    let targetTime = Date.now() + (2 * 24 * 3600 * 1000) + (5 * 3600 * 1000) + (12 * 60 * 1000) + 44 * 1000;
    
    const interval = setInterval(() => {
        // Check if element is still in DOM to prevent memory leak
        if (!document.body.contains(timerElement)) {
            clearInterval(interval);
            return;
        }

        const now = Date.now();
        const diff = targetTime - now;

        if (diff <= 0) {
            clearInterval(interval);
            timerElement.innerText = "Season Finished! Resetting...";
            return;
        }

        const days = Math.floor(diff / (24 * 3600 * 1000));
        const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
        const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
        const secs = Math.floor((diff % (60 * 1000)) / 1000);

        timerElement.innerText = `Season Ends: ${days}d ${hours}h ${mins}m ${secs}s`;
    }, 1000);
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
