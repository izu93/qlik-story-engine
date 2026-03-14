/**
 * Scroll Engine — IntersectionObserver-based chapter tracker
 *
 * Observes narrative panels and fires callbacks when chapters
 * enter/leave the viewport, driving scene transitions in VizCanvas.
 */

export function createScroller({ container, panelSelector = '[data-chapter]', threshold = 0.5, onChapterEnter, onChapterExit, onProgress }) {
  let currentChapter = -1;
  let panels = [];
  let observer = null;
  let progressRaf = null;

  function init() {
    panels = Array.from(container.querySelectorAll(panelSelector));
    if (!panels.length) return;

    observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '0px',
      threshold: buildThresholds(),
    });

    panels.forEach((panel) => observer.observe(panel));

    if (onProgress) {
      trackProgress();
    }
  }

  function buildThresholds() {
    const steps = 20;
    return Array.from({ length: steps + 1 }, (_, i) => i / steps);
  }

  function handleIntersection(entries) {
    for (const entry of entries) {
      const idx = panels.indexOf(entry.target);
      if (idx === -1) continue;

      if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
        if (idx !== currentChapter) {
          const prev = currentChapter;
          currentChapter = idx;
          if (prev >= 0) onChapterExit?.(prev, panels[prev]);
          onChapterEnter?.(idx, panels[idx]);
        }
      }
    }
  }

  function trackProgress() {
    function tick() {
      if (!panels.length) return;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const globalProgress = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;

      onProgress?.({
        globalProgress,
        currentChapter,
        totalChapters: panels.length,
        chapterProgress: computeChapterProgress(),
      });

      progressRaf = requestAnimationFrame(tick);
    }
    tick();
  }

  function computeChapterProgress() {
    if (currentChapter < 0 || !panels[currentChapter]) return 0;
    const rect = panels[currentChapter].getBoundingClientRect();
    const panelHeight = rect.height;
    if (panelHeight === 0) return 0;
    const visible = Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top);
    return Math.max(0, Math.min(1, visible / panelHeight));
  }

  function destroy() {
    observer?.disconnect();
    if (progressRaf) cancelAnimationFrame(progressRaf);
    panels = [];
    currentChapter = -1;
  }

  return { init, destroy, getCurrentChapter: () => currentChapter };
}
