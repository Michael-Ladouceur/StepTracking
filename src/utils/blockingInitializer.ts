import blockingService from "../services/blockingService";
import contentBlocker from "../services/contentBlocker";

// Initialize blocking functionality when the app loads
export const initializeBlocking = () => {
  // Initialize content blocker for current page
  if (typeof window !== "undefined") {
    contentBlocker.init();

    // Check if we should block the current page
    if (blockingService.shouldBlockWebsite(window.location.href)) {
      console.log("Current page should be blocked");
    }

    // Listen for navigation events
    window.addEventListener("beforeunload", () => {
      contentBlocker.destroy();
    });

    // Handle browser back/forward navigation
    window.addEventListener("popstate", () => {
      setTimeout(() => {
        if (blockingService.shouldBlockWebsite(window.location.href)) {
          contentBlocker.init();
        }
      }, 100);
    });
  }
};

// Cleanup function
export const cleanupBlocking = () => {
  contentBlocker.destroy();
  blockingService.destroy();
};

// Export services for use in components
export { blockingService, contentBlocker };
