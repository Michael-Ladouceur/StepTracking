import blockingService from "./blockingService";

class ContentBlocker {
  private isInitialized = false;
  private observer: MutationObserver | null = null;

  init(): void {
    if (this.isInitialized) return;

    this.isInitialized = true;
    this.setupPageBlocking();
    this.setupNavigationBlocking();
    this.setupDOMObserver();
  }

  private setupPageBlocking(): void {
    // Check if current page should be blocked
    if (blockingService.shouldBlockWebsite(window.location.href)) {
      this.blockCurrentPage();
    }
  }

  private setupNavigationBlocking(): void {
    // Intercept navigation attempts
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (state, title, url) {
      if (url && blockingService.shouldBlockWebsite(url.toString())) {
        console.log("Navigation blocked:", url);
        return;
      }
      return originalPushState.apply(history, arguments as any);
    };

    history.replaceState = function (state, title, url) {
      if (url && blockingService.shouldBlockWebsite(url.toString())) {
        console.log("Navigation blocked:", url);
        return;
      }
      return originalReplaceState.apply(history, arguments as any);
    };

    // Block link clicks
    document.addEventListener(
      "click",
      (event) => {
        const target = event.target as HTMLElement;
        const link = target.closest("a");

        if (link && link.href) {
          if (blockingService.shouldBlockWebsite(link.href)) {
            event.preventDefault();
            event.stopPropagation();
            this.showBlockedLinkMessage(link.href);
          }
        }
      },
      true,
    );

    // Block form submissions to blocked domains
    document.addEventListener(
      "submit",
      (event) => {
        const form = event.target as HTMLFormElement;
        if (form.action && blockingService.shouldBlockWebsite(form.action)) {
          event.preventDefault();
          event.stopPropagation();
          this.showBlockedLinkMessage(form.action);
        }
      },
      true,
    );
  }

  private setupDOMObserver(): void {
    // Watch for dynamically added content that might need blocking
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // Check for iframes that might load blocked content
            const iframes = element.querySelectorAll("iframe");
            iframes.forEach((iframe) => {
              if (
                iframe.src &&
                blockingService.shouldBlockWebsite(iframe.src)
              ) {
                iframe.remove();
              }
            });

            // Check for links to blocked sites
            const links = element.querySelectorAll("a[href]");
            links.forEach((link) => {
              const href = (link as HTMLAnchorElement).href;
              if (blockingService.shouldBlockWebsite(href)) {
                link.addEventListener("click", (e) => {
                  e.preventDefault();
                  this.showBlockedLinkMessage(href);
                });
              }
            });
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private blockCurrentPage(): void {
    // Create blocking overlay
    const overlay = this.createBlockingOverlay();
    document.body.innerHTML = "";
    document.body.appendChild(overlay);

    // Prevent scrolling
    document.body.style.overflow = "hidden";

    // Block common escape methods
    document.addEventListener("keydown", (e) => {
      // Block F12, Ctrl+Shift+I, Ctrl+U, etc.
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault();
      }
    });
  }

  private createBlockingOverlay(): HTMLElement {
    const overlay = document.createElement("div");
    const status = blockingService.getBlockingStatus();

    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const progressPercentage = Math.min(
      100,
      (status.currentSteps / status.goalSteps) * 100,
    );

    overlay.innerHTML = `
      <div style="
        background: white;
        padding: 2rem;
        border-radius: 1rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        text-align: center;
        max-width: 400px;
        margin: 1rem;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="
          width: 80px;
          height: 80px;
          background: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        ">
          <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <h1 style="
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 1rem;
          color: #1f2937;
        ">
          Site Blocked
        </h1>
        <p style="
          color: #6b7280;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        ">
          This site is blocked until you reach your daily step goal. Get moving to unlock access!
        </p>
        <div style="
          background: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
        ">
          <div style="color: #374151; font-weight: 600; margin-bottom: 0.5rem;">
            Progress: ${status.currentSteps.toLocaleString()} / ${status.goalSteps.toLocaleString()} steps
          </div>
          <div style="
            background: #e5e7eb;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
          ">
            <div style="
              background: #3b82f6;
              height: 100%;
              width: ${progressPercentage}%;
              transition: width 0.3s ease;
            "></div>
          </div>
          <div style="color: #6b7280; font-size: 0.875rem; margin-top: 0.5rem;">
            ${status.remainingSteps.toLocaleString()} steps remaining
          </div>
        </div>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button onclick="window.history.back()" style="
            background: #6b7280;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          ">
            Go Back
          </button>
          <button onclick="window.location.reload()" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          ">
            Check Progress
          </button>
        </div>
      </div>
      <style>
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      </style>
    `;

    return overlay;
  }

  private showBlockedLinkMessage(url: string): void {
    const status = blockingService.getBlockingStatus();

    // Create a temporary notification
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      z-index: 1000000;
      max-width: 300px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideInRight 0.3s ease-out;
    `;

    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 0.5rem;">Link Blocked</div>
      <div style="font-size: 0.875rem; opacity: 0.9;">
        Complete ${status.remainingSteps.toLocaleString()} more steps to access this link.
      </div>
      <style>
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      </style>
    `;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isInitialized = false;
  }
}

export const contentBlocker = new ContentBlocker();
export default contentBlocker;
