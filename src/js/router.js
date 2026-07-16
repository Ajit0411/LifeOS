/**
 * LifeOS Router
 * Handles hash-based SPA routing, manages container transitions,
 * active link toggling, and page rendering hooks.
 */

export class Router {
    constructor(routes = {}) {
        this.routes = routes;
        
        // Bind event listeners
        window.addEventListener("hashchange", () => this.navigate());
        window.addEventListener("DOMContentLoaded", () => this.navigate());
    }

    navigate() {
        const hash = window.location.hash || "#dashboard";
        const pageId = hash.slice(1);
        
        // Target Page element
        const pageElement = document.getElementById(`view-${pageId}`);
        if (!pageElement) {
            // Redirect to dashboard fallback
            window.location.hash = "#dashboard";
            return;
        }

        // Deactivate all views
        document.querySelectorAll(".page-view").forEach(view => {
            view.classList.remove("active");
        });

        // Activate target view
        pageElement.classList.add("active");

        // Update nav links styling
        document.querySelectorAll(".nav-link").forEach(link => {
            const linkHash = link.getAttribute("href");
            if (linkHash === hash) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });

        // Trigger header update hook if registered
        if (this.routes._beforeRoute) {
            this.routes._beforeRoute(pageId);
        }

        // Trigger page rendering callback hook
        if (this.routes[pageId]) {
            this.routes[pageId](pageElement);
        }
        
        // Scroll view to top
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}
