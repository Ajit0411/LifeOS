/**
 * LifeOS Toast Notification Manager
 * Handles real-time system-wide floating notifications for achievements,
 * level-ups, daily quest updates, and user alerts.
 */

import { State } from "../state.js";

class NotificationToastManager {
    constructor() {
        this.container = null;
        this.init();
        
        // Listen to state engine events
        window.addEventListener("new-toast", (e) => {
            this.show(e.detail);
        });
    }

    init() {
        // Create notifications container on body if not present
        let container = document.getElementById("toast-notif-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-notif-container";
            container.className = "toast-notif-container";
            
            // Inline style overlay for container
            Object.assign(container.style, {
                position: "fixed",
                bottom: "24px",
                right: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                zIndex: "9999",
                pointerEvents: "none"
            });
            
            document.body.appendChild(container);
        }
        this.container = container;
    }

    show(notification) {
        const { title, message, type } = notification;
        
        // Create toast element
        const toast = document.createElement("div");
        toast.className = `toast-notif ${type}-toast`;
        toast.style.pointerEvents = "auto"; // allow clicks
        
        // Pick icon
        let icon = "🔔";
        if (type === "level-up") icon = "🏆";
        else if (type === "achievement") icon = "✨";
        else if (type === "quest") icon = "⚡";
        else if (type === "undo") icon = "🔄";
        else if (type === "streak-break") icon = "⚠️";

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-desc">${message}</div>
            </div>
        `;

        this.container.appendChild(toast);

        // Slide out and remove after 4.5 seconds
        setTimeout(() => {
            toast.style.transition = "all 0.4s cubic-bezier(0.6, -0.28, 0.735, 0.045)";
            toast.style.transform = "translateX(120%) scale(0.9)";
            toast.style.opacity = "0";
            
            setTimeout(() => {
                toast.remove();
            }, 400);
        }, 4500);

        // Allow clicking toast to dismiss immediately
        toast.addEventListener("click", () => {
            toast.style.transform = "translateX(120%) scale(0.9)";
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 400);
        });
    }
}

export const NotificationToasts = new NotificationToastManager();
