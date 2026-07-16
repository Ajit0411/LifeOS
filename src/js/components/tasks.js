/**
 * LifeOS Smart Task Manager Component
 * Renders task filters, sorting, high/medium/low priority tags,
 * floating XP rewards, delete triggers, and undo overlay toasts.
 */

import { State } from "../state.js";

// Global filter and sort values cached
let currentFilter = "all"; // all, active, completed
let currentSort = "date"; // date, priority

export function renderTasks(container) {
    const state = State.state;

    // Filter tasks
    let filteredTasks = [...state.tasks];
    if (currentFilter === "active") {
        filteredTasks = filteredTasks.filter(t => !t.completed);
    } else if (currentFilter === "completed") {
        filteredTasks = filteredTasks.filter(t => t.completed);
    }

    // Sort tasks
    if (currentSort === "priority") {
        const priorityWeights = { high: 3, medium: 2, low: 1 };
        filteredTasks.sort((a, b) => priorityWeights[b.priority] - priorityWeights[a.priority]);
    } else {
        // Date sorting (Newest first)
        filteredTasks.sort((a, b) => b.createdAt - a.createdAt);
    }

    // Build tasks HTML list
    const tasksHtml = filteredTasks.map(t => {
        return `
            <div class="task-item-card ${t.completed ? 'completed' : ''}" data-id="${t.id}">
                <div class="task-item-left">
                    <button class="task-checkbox" title="Mark Complete">
                        ${t.completed ? '<i class="fas fa-check"></i>' : ''}
                    </button>
                    <div class="task-info-block">
                        <span class="task-title-text">${escapeHTML(t.title)}</span>
                        <div class="task-meta-row">
                            <span class="task-tag priority-${t.priority}">${t.priority}</span>
                            <span class="task-category"><i class="fas fa-folder"></i> ${escapeHTML(t.category)}</span>
                            <span class="task-xp-reward"><i class="fas fa-bolt"></i> +${t.xp} XP</span>
                        </div>
                    </div>
                </div>
                <div class="task-item-right">
                    <button class="btn-delete-task" title="Delete Task">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    const emptyStateHtml = `
        <div class="noti-empty" style="padding: 40px 0; text-align: center;">
            <i class="fas fa-tasks" style="font-size: 32px; color: var(--text-muted); margin-bottom: 12px; display: block;"></i>
            No tasks found in this category. Let's create one!
        </div>
    `;

    container.innerHTML = `
        <div class="tasks-layout">
            <!-- Left Side: Task list -->
            <div class="tasks-main-panel">
                <div class="tasks-action-bar">
                    <!-- Filters Tabs -->
                    <div class="tasks-filters">
                        <button class="filter-tab ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
                        <button class="filter-tab ${currentFilter === 'active' ? 'active' : ''}" data-filter="active">Active</button>
                        <button class="filter-tab ${currentFilter === 'completed' ? 'active' : ''}" data-filter="completed">Completed</button>
                    </div>

                    <!-- Sorting options -->
                    <div class="tasks-sort">
                        <span>Sort by:</span>
                        <select id="tasks-sort-select">
                            <option value="date" ${currentSort === 'date' ? 'selected' : ''}>Date Added</option>
                            <option value="priority" ${currentSort === 'priority' ? 'selected' : ''}>Priority</option>
                        </select>
                    </div>
                </div>

                <!-- Task Items List -->
                <div class="task-items-list">
                    ${filteredTasks.length > 0 ? tasksHtml : emptyStateHtml}
                </div>
            </div>

            <!-- Right Side: Create Task Sticky Panel -->
            <div class="tasks-creator-panel">
                <div class="glass-card creator-card">
                    <h3><i class="fas fa-plus-circle"></i> Create Quest</h3>
                    <form id="create-task-form">
                        <div class="form-group">
                            <label for="task-title">Task Title</label>
                            <input type="text" id="task-title" placeholder="What are you working on?" required autocomplete="off">
                        </div>

                        <div class="form-group">
                            <label for="task-priority">Priority</label>
                            <select id="task-priority">
                                <option value="high">High (+50 XP)</option>
                                <option value="medium" selected>Medium (+30 XP)</option>
                                <option value="low">Low (+15 XP)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="task-category">Category</label>
                            <select id="task-category">
                                <option value="Coding">Coding</option>
                                <option value="Study">Study</option>
                                <option value="Life">Life</option>
                                <option value="Fitness">Fitness</option>
                            </select>
                        </div>

                        <button type="submit" class="btn-submit-task">
                            Add Quest <i class="fas fa-arrow-right"></i>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Hook filters listeners
    container.querySelectorAll(".filter-tab").forEach(tab => {
        tab.addEventListener("click", (e) => {
            currentFilter = e.target.getAttribute("data-filter");
            renderTasks(container);
        });
    });

    // Hook sort listener
    const sortSelect = container.querySelector("#tasks-sort-select");
    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
            currentSort = e.target.value;
            renderTasks(container);
        });
    }

    // Hook form submit listener
    const form = container.querySelector("#create-task-form");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const titleInput = container.querySelector("#task-title");
            const prioritySelect = container.querySelector("#task-priority");
            const categorySelect = container.querySelector("#task-category");

            State.addTask(
                titleInput.value.trim(),
                prioritySelect.value,
                categorySelect.value
            );

            // Re-render
            renderTasks(container);
        });
    }

    // Hook click action listeners for checkboxes & deletes
    container.querySelectorAll(".task-item-card").forEach(card => {
        const id = card.getAttribute("data-id");
        
        // Completion Checkbox
        const checkbox = card.querySelector(".task-checkbox");
        if (checkbox) {
            checkbox.addEventListener("click", (e) => {
                e.stopPropagation();
                
                // Show floating XP indicator
                const rect = checkbox.getBoundingClientRect();
                const task = state.tasks.find(t => t.id === id);
                if (task && !task.completed) {
                    showXpFloat(rect.left + rect.width / 2, rect.top, task.xp);
                    
                    // Toggle in state
                    State.completeTask(id);
                    
                    // Show Undo Toast
                    showUndoToast(task.title);

                    // Re-render view
                    renderTasks(container);
                }
            });
        }

        // Delete trigger
        const btnDelete = card.querySelector(".btn-delete-task");
        if (btnDelete) {
            btnDelete.addEventListener("click", (e) => {
                e.stopPropagation();
                State.deleteTask(id);
                renderTasks(container);
            });
        }
    });
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

// Visual Floating XP Indicator
function showXpFloat(x, y, amount) {
    const indicator = document.createElement("span");
    indicator.className = "xp-float-indicator";
    indicator.innerText = `+${amount} XP`;
    
    // Position absolute on viewport
    indicator.style.left = `${x + window.scrollX}px`;
    indicator.style.top = `${y + window.scrollY}px`;
    
    document.body.appendChild(indicator);
    
    // Automatically cleanup
    setTimeout(() => {
        indicator.remove();
    }, 1000);
}

// Undo Overlay Toast logic
let activeUndoToast = null;
let activeUndoTimer = null;

function showUndoToast(taskTitle) {
    // Recreate wrapper container if not present
    let container = document.getElementById("undo-toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "undo-toast-container";
        container.className = "undo-toast-container";
        document.body.appendChild(container);
    }

    // Dismiss existing
    if (activeUndoToast) {
        clearTimeout(activeUndoTimer);
        activeUndoToast.remove();
    }

    const toast = document.createElement("div");
    toast.className = "undo-toast";
    toast.innerHTML = `
        <span class="undo-toast-text">Completed "${taskTitle.substring(0, 25)}..."</span>
        <button class="btn-undo-action" id="btn-toast-undo">Undo</button>
    `;

    container.appendChild(toast);
    activeUndoToast = toast;

    // Attach click listener
    const btnUndo = toast.querySelector("#btn-toast-undo");
    if (btnUndo) {
        btnUndo.addEventListener("click", () => {
            State.undoLastAction();
            toast.remove();
            
            // Re-render whatever view is active
            const pageView = document.querySelector(".page-view.active");
            if (pageView) {
                // Trigger hash change to refresh current view
                const hash = window.location.hash || "#dashboard";
                window.dispatchEvent(new HashChangeEvent("hashchange"));
            }
        });
    }

    // Automatically remove after 5 seconds
    activeUndoTimer = setTimeout(() => {
        toast.style.transition = "all 0.3s ease";
        toast.style.transform = "translateX(120%)";
        toast.style.opacity = "0";
        setTimeout(() => {
            toast.remove();
            if (activeUndoToast === toast) {
                activeUndoToast = null;
            }
        }, 300);
    }, 5000);
}
