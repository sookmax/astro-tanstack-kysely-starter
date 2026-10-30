// The overlay ReactServerEntry ships in the first-paint HTML, covering the page
// until hydration; __root's effect removes it. e2e reuses `selector()` as its
// "hydrated" signal (e2e/browser/helpers/hydration.ts).
export const ssrLoadingIndicator = {
  id: "ssr-loading-indicator",
  selector() {
    return `#${this.id}`;
  },
  remove() {
    document.getElementById(this.id)?.remove();
  },
};
