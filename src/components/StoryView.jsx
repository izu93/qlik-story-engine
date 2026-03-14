import { useState, useEffect, useRef, useCallback } from 'react';
import { createScroller } from '../lib/scroller.js';
import { recommendScenes, generateNarrative } from '../lib/recommender.js';
import VizCanvas from './VizCanvas.jsx';
import NarrativePanel from './NarrativePanel.jsx';
import HUD from './HUD.jsx';

export default function StoryView({ data }) {
  const [chapters, setChapters] = useState([]);
  const [activeChapter, setActiveChapter] = useState(0);
  const [scrollProgress, setScrollProgress] = useState({
    globalProgress: 0,
    chapterProgress: 0,
  });
  const narrativeRef = useRef(null);
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (!data) return;

    const scenes = recommendScenes(data);
    const seen = new Set();
    const unique = scenes.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
    const built = unique.map((scene) => ({
      sceneId: scene.id,
      scene,
      ...generateNarrative(scene, data.stats),
    }));
    setChapters(built);
    setActiveChapter(0);
  }, [data]);

  useEffect(() => {
    const container = narrativeRef.current;
    if (!container || !chapters.length) return;

    const scroller = createScroller({
      container,
      panelSelector: '[data-chapter]',
      threshold: 0.4,
      onChapterEnter: (idx) => setActiveChapter(idx),
      onChapterExit: () => {},
      onProgress: (p) =>
        setScrollProgress({
          globalProgress: p.globalProgress,
          chapterProgress: p.chapterProgress,
        }),
    });

    // defer init to ensure panels are in the DOM
    requestAnimationFrame(() => scroller.init());
    scrollerRef.current = scroller;

    return () => scroller.destroy();
  }, [chapters]);

  const activeScene = chapters[activeChapter]?.scene || null;
  const activeData = getSceneData(activeScene, data);

  const handleSwapScene = useCallback(
    (chapterIdx) => {
      setChapters((prev) => {
        const copy = [...prev];
        const allScenes = recommendScenes(data);
        const currentId = copy[chapterIdx].sceneId;
        const candidates = allScenes.filter((s) => s.id !== currentId);
        if (!candidates.length) return prev;

        const next = candidates[0];

        copy[chapterIdx] = {
          ...copy[chapterIdx],
          sceneId: next.id,
          scene: next,
          ...generateNarrative(next, data.stats),
        };
        return copy;
      });
    },
    [data]
  );

  return (
    <div className="story-view">
      <HUD
        currentChapter={activeChapter}
        totalChapters={chapters.length}
        globalProgress={scrollProgress.globalProgress}
        chapterProgress={scrollProgress.chapterProgress}
      />
      <div className="story-view__layout">
        <div className="story-view__sticky">
          <VizCanvas
            scene={activeScene}
            data={activeData}
          />
        </div>
        <div className="story-view__narrative" ref={narrativeRef}>
          <NarrativePanel
            chapters={chapters}
            activeChapter={activeChapter}
            onSwapScene={handleSwapScene}
          />
        </div>
      </div>
    </div>
  );
}

function getSceneData(scene, data) {
  if (!scene || !data) return null;

  switch (scene.id) {
    case 'chord-flows':
      return data.flows;
    default:
      return data.accounts;
  }
}
