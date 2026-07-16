/**
 * LifeOS Analytics Page Component
 * Renders weekly productivity gauges, study hours line charts,
 * completed tasks bar charts, and a GitHub-style activity contribution heatmap.
 */

import { State } from "../state.js";

let taskChartInstance = null;
let hoursChartInstance = null;
let gaugeChartInstance = null;

export function renderAnalytics(container) {
    const state = State.state;

    // Render HTML Shell
    container.innerHTML = `
        <div class="analytics-grid">
            <!-- Heatmap Row -->
            <div class="glass-card analytics-full-width heatmap-card">
                <div class="section-header" style="margin-bottom: 8px;">
                    <h3><i class="fas fa-calendar-alt" style="color: var(--color-cyan);"></i> Activity Grid</h3>
                    <span style="font-size: 11px; color: var(--text-muted);">Tasks Completed History</span>
                </div>
                <div class="heatmap-grid" id="analytics-heatmap">
                    <!-- Dynamic squares -->
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 6px; align-items: center; margin-top: 12px; font-size: 10px; color: var(--text-muted);">
                    <span>Less</span>
                    <div class="heatmap-day level-0" style="width: 10px; height: 10px; aspect-ratio: 1;"></div>
                    <div class="heatmap-day level-1" style="width: 10px; height: 10px; aspect-ratio: 1;"></div>
                    <div class="heatmap-day level-2" style="width: 10px; height: 10px; aspect-ratio: 1;"></div>
                    <div class="heatmap-day level-3" style="width: 10px; height: 10px; aspect-ratio: 1;"></div>
                    <div class="heatmap-day level-4" style="width: 10px; height: 10px; aspect-ratio: 1;"></div>
                    <span>More</span>
                </div>
            </div>

            <!-- Task Completions (Bar) -->
            <div class="glass-card">
                <div class="section-header" style="margin-bottom: 12px;">
                    <h3><i class="fas fa-chart-bar" style="color: var(--color-green);"></i> Weekly Quests</h3>
                </div>
                <div class="chart-wrapper">
                    <canvas id="chart-tasks"></canvas>
                </div>
            </div>

            <!-- Study Hours (Line) -->
            <div class="glass-card">
                <div class="section-header" style="margin-bottom: 12px;">
                    <h3><i class="fas fa-chart-line" style="color: var(--color-purple);"></i> Study Clock</h3>
                </div>
                <div class="chart-wrapper">
                    <canvas id="chart-hours"></canvas>
                </div>
            </div>

            <!-- Gauge/Efficiency (Doughnut) -->
            <div class="glass-card analytics-full-width">
                <div class="section-header" style="margin-bottom: 12px;">
                    <h3><i class="fas fa-tachometer-alt" style="color: var(--color-yellow);"></i> Focus Efficiency Gauge</h3>
                </div>
                <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr; align-items: center; width: 100%;">
                    <div class="chart-wrapper">
                        <canvas id="chart-gauge"></canvas>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 14px; text-align: left;">
                        <div>
                            <h4 style="font-size: 28px; color: var(--color-cyan); text-shadow: var(--cyan-glow);">${state.user.productivityScore}%</h4>
                            <span style="font-size: 12px; color: var(--text-secondary);">Current Productivity Score</span>
                        </div>
                        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5;">
                            Calculated dynamically based on active task fulfillment, study durations, and completed daily quest challenges. Reaching above 85% unlocks secondary bonus XP multipliers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Render elements
    renderHeatmap(container, state);
    
    // Draw charts using Chart.js after small delay to let DOM paint
    setTimeout(() => {
        initCharts(state);
    }, 100);
}

// Render GitHub style contribution activity heatmap grid
function renderHeatmap(container, state) {
    const grid = container.querySelector("#analytics-heatmap");
    if (!grid) return;

    grid.innerHTML = "";
    const today = new Date();
    const daysToShow = 105; // 15 columns * 7 rows

    // Calculate dates starting from 104 days ago
    const dateArray = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        dateArray.push(d);
    }

    dateArray.forEach(date => {
        const dateStr = date.toDateString();
        const count = state.analytics.heatmapHistory[dateStr] || 0;
        
        let levelClass = "level-0";
        if (count === 1) levelClass = "level-1";
        else if (count === 2) levelClass = "level-2";
        else if (count === 3) levelClass = "level-3";
        else if (count >= 4) levelClass = "level-4";

        const daySquare = document.createElement("div");
        daySquare.className = `heatmap-day ${levelClass}`;
        
        // Month formatting for tooltip
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        daySquare.setAttribute("data-tooltip", `${count} quests completed on ${formattedDate}`);

        grid.appendChild(daySquare);
    });
}

// Chart.js configurations
function initCharts(state) {
    // Destroy previous instances to avoid overlay redraw canvas bugs
    if (taskChartInstance) taskChartInstance.destroy();
    if (hoursChartInstance) hoursChartInstance.destroy();
    if (gaugeChartInstance) gaugeChartInstance.destroy();

    const daysLabel = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // 1. Task Completions Bar Chart
    const ctxTasks = document.getElementById("chart-tasks");
    if (ctxTasks) {
        taskChartInstance = new Chart(ctxTasks, {
            type: "bar",
            data: {
                labels: daysLabel,
                datasets: [{
                    label: "Tasks Completed",
                    data: state.analytics.weeklyCompletion,
                    backgroundColor: "rgba(0, 255, 102, 0.45)",
                    borderColor: "#00ff66",
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: getChartOptions()
        });
    }

    // 2. Study Hours Line Chart
    const ctxHours = document.getElementById("chart-hours");
    if (ctxHours) {
        hoursChartInstance = new Chart(ctxHours, {
            type: "line",
            data: {
                labels: daysLabel,
                datasets: [{
                    label: "Study Hours",
                    data: state.analytics.studyHours,
                    borderColor: "#bd00ff",
                    backgroundColor: "rgba(189, 0, 255, 0.1)",
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: "#fff",
                    pointBorderColor: "#bd00ff",
                    pointRadius: 4
                }]
            },
            options: getChartOptions()
        });
    }

    // 3. Gauge Doughnut Chart
    const ctxGauge = document.getElementById("chart-gauge");
    if (ctxGauge) {
        const score = state.user.productivityScore;
        gaugeChartInstance = new Chart(ctxGauge, {
            type: "doughnut",
            data: {
                datasets: [{
                    data: [score, 100 - score],
                    backgroundColor: ["#00f0ff", "rgba(255, 255, 255, 0.03)"],
                    borderWidth: 0,
                    hoverOffset: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "80%",
                rotation: -90,
                circumference: 180,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }
}

// Standard modern chart themes configurations
function getChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: "#12121c",
                titleColor: "#fff",
                bodyColor: "#94a3b8",
                borderColor: "rgba(255, 255, 255, 0.08)",
                borderWidth: 1,
                cornerRadius: 8,
                padding: 10,
                displayColors: false
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: "#64748b",
                    font: { family: "'Plus Jakarta Sans', sans-serif" }
                }
            },
            y: {
                grid: {
                    color: "rgba(255, 255, 255, 0.03)"
                },
                ticks: {
                    color: "#64748b",
                    font: { family: "'Plus Jakarta Sans', sans-serif" }
                },
                border: {
                    dash: [5, 5]
                }
            }
        }
    };
}
