import { useState, useEffect, useRef, useCallback } from 'react';
import { createScroller } from '../lib/scroller.js';
import { recommendScenes, generateNarrative } from '../lib/recommender.js';
import VizCanvas from './VizCanvas.jsx';
import NarrativePanel from './NarrativePanel.jsx';
import HUD from './HUD.jsx';
import Tooltip, { useTooltip } from './Tooltip.jsx';

export default function StoryView({ data }) {
  const [chapters, setChapters] = useState([]);
  const [activeChapter, setActiveChapter] = useState(-1);
  const [scrollProgress, setScrollProgress] = useState({
    globalProgress: 0,
    chapterProgress: 0,
  });
  const narrativeRef = useRef(null);
  const scrollerRef = useRef(null);
  const { tooltip, showTooltip, hideTooltip } = useTooltip();

  useEffect(() => {
    if (!data) return;

    const scenes = recommendScenes(data);
    const built = scenes.map((scene) => ({
      sceneId: scene.id,
      scene,
      ...generateNarrative(scene, data.stats),
    }));
    setChapters(built);
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
        const alternatives = allScenes.filter((s) => s.id !== currentId);
        if (!alternatives.length) return prev;

        const next = alternatives[0];
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
            onHover={showTooltip}
            onLeave={hideTooltip}
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
      <Tooltip tooltip={tooltip} />
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
