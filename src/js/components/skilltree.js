/**
 * LifeOS Skill Tree Component
 * Renders the learning track (C++ -> DSA -> OOP -> Projects -> Internship Prep).
 * Uses dynamic SVG path connections and slide-over panels for module tracking.
 */

import { State } from "../state.js";

let selectedNodeId = "cpp"; // default selected

export function renderSkillTree(container) {
    const state = State.state;

    // Active Node Details
    const activeNode = state.skills.find(s => s.id === selectedNodeId) || state.skills[0];

    // Build skill nodes list
    const nodesHtml = state.skills.map((skill, index) => {
        let icon = "🔒";
        if (skill.id === "cpp") icon = "💻";
        else if (skill.id === "dsa") icon = "🌳";
        else if (skill.id === "oop") icon = "🧱";
        else if (skill.id === "projects") icon = "🚀";
        else if (skill.id === "internship") icon = "💼";

        return `
            <div class="skill-node ${skill.status} ${skill.id === selectedNodeId ? 'selected-glow' : ''}" 
                 id="node-${skill.id}" 
                 data-id="${skill.id}">
                <div class="node-icon-wrapper">
                    ${skill.status === 'locked' ? '🔒' : icon}
                </div>
                <div class="node-label">
                    <span class="node-title-main">${skill.title}</span>
                    <span class="node-status-text ${skill.status}">${skill.status.replace('_', ' ')}</span>
                </div>
            </div>
        `;
    }).join('');

    // Objectives Checklist HTML
    const objectivesHtml = activeNode.objectives.map(o => {
        return `
            <div class="objective-item ${o.completed ? 'completed' : ''}" data-obj-id="${o.id}">
                <div class="objective-checkbox">
                    ${o.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <span class="objective-text">${escapeHTML(o.text)}</span>
            </div>
        `;
    }).join('');

    // Side panel syllabus HTML
    const detailPanelHtml = `
        <div class="glass-card skill-details-panel">
            <h3>${activeNode.title}</h3>
            <span class="skill-status-tag ${activeNode.status}">${activeNode.status.replace('_', ' ')}</span>
            <p class="skill-desc-text">${activeNode.desc}</p>
            
            ${activeNode.status !== 'locked' ? `
                <div class="form-group" style="margin-bottom: 12px;">
                    <label>Module Objectives</label>
                </div>
                <div class="skill-objectives-list">
                    ${objectivesHtml}
                </div>
                
                <button class="btn-complete-node" id="btn-master-node" 
                        ${activeNode.status === 'completed' ? 'disabled' : ''}>
                    ${activeNode.status === 'completed' ? 'Module Mastered ✓' : `Master Module (+${activeNode.xpReward} XP)`}
                </button>
            ` : `
                <div class="noti-empty" style="padding: 20px; border-radius: 8px; border: 1px dashed var(--border-color); background: rgba(255, 51, 102, 0.05); color: var(--color-red);">
                    <i class="fas fa-lock" style="font-size: 20px; margin-bottom: 8px; display: block;"></i>
                    This module is locked. Complete the preceding module to unlock.
                </div>
            `}
        </div>
    `;

    container.innerHTML = `
        <div class="skilltree-layout">
            <!-- Left Side: Interactive SVG flow tree -->
            <div class="skilltree-container" id="skilltree-graph-box">
                <!-- SVG Canvas for connecting nodes -->
                <svg class="skilltree-svg-canvas" id="skilltree-svg"></svg>
                
                <!-- Skill Nodes Stack -->
                <div class="skill-nodes-wrapper">
                    ${nodesHtml}
                </div>
            </div>

            <!-- Right Side: Node Curricula / Details Panel -->
            <div class="skilltree-sidebar">
                ${detailPanelHtml}
            </div>
        </div>
    `;

    // Hook click action to change active node view
    container.querySelectorAll(".skill-node").forEach(node => {
        node.addEventListener("click", () => {
            selectedNodeId = node.getAttribute("data-id");
            renderSkillTree(container);
        });
    });

    // Hook objective checklist toggles
    container.querySelectorAll(".objective-item").forEach(item => {
        item.addEventListener("click", () => {
            const objId = item.getAttribute("data-obj-id");
            State.toggleObjective(activeNode.id, objId);
            renderSkillTree(container);
        });
    });

    // Hook direct node mastering click
    const btnMaster = container.querySelector("#btn-master-node");
    if (btnMaster) {
        btnMaster.addEventListener("click", () => {
            State.completeSkillNodeDirectly(activeNode.id);
            renderSkillTree(container);
        });
    }

    // SVG Drawing lifecycle
    setTimeout(() => {
        drawSvgConnections(container);
    }, 50);
}

// Draw Curved S-shape lines connecting nodes dynamically
function drawSvgConnections(container) {
    const svg = container.querySelector("#skilltree-svg");
    const graphBox = container.querySelector("#skilltree-graph-box");
    if (!svg || !graphBox) return;

    // Reset SVG sizes to match graph box height & width
    const rect = graphBox.getBoundingClientRect();
    svg.setAttribute("width", rect.width);
    svg.setAttribute("height", rect.height);
    
    // Clear previous paths
    svg.innerHTML = "";

    const sequence = ["cpp", "dsa", "oop", "projects", "internship"];
    const state = State.state;

    for (let i = 0; i < sequence.length - 1; i++) {
        const currentId = sequence[i];
        const nextId = sequence[i+1];
        
        const nodeCur = container.querySelector(`#node-${currentId}`);
        const nodeNext = container.querySelector(`#node-${nextId}`);
        
        if (nodeCur && nodeNext) {
            const rCur = nodeCur.getBoundingClientRect();
            const rNext = nodeNext.getBoundingClientRect();
            const rGraph = graphBox.getBoundingClientRect();

            // Center positions relative to graph container
            const x1 = (rCur.left + rCur.width / 2) - rGraph.left;
            const y1 = (rCur.top + rCur.height / 2) - rGraph.top;
            
            const x2 = (rNext.left + rNext.width / 2) - rGraph.left;
            const y2 = (rNext.top + rNext.height / 2) - rGraph.top;

            // Curved cubic bezier path drawing coordinates
            // C x1 (y1 + dy), x2 (y2 - dy), x2 y2
            const dy = (y2 - y1) / 2;
            const pathData = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;

            // Create Path node
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathData);
            
            // Apply path class depending on node completion statuses
            const curSkill = state.skills.find(s => s.id === currentId);
            const nextSkill = state.skills.find(s => s.id === nextId);

            if (curSkill && curSkill.status === "completed" && nextSkill && nextSkill.status !== "locked") {
                path.classList.add("completed");
            } else if (curSkill && curSkill.status === "completed") {
                path.classList.add("unlocked");
            }

            svg.appendChild(path);
        }
    }
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

// Listen for window resize to redraw SVG path coordinates
window.addEventListener("resize", () => {
    const skilltreeView = document.getElementById("view-skilltree");
    if (skilltreeView && skilltreeView.classList.contains("active")) {
        drawSvgConnections(skilltreeView);
    }
});
