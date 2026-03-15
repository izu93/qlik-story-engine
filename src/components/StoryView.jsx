import { useState, useEffect, useRef, useCallback } from 'react';
import { createScroller } from '../lib/scroller.js';
import { recommendScenes, generateNarrative } from '../lib/recommender.js';
import { matchVizRule, buildThinkingSteps } from '../lib/vizIntelligence.js';
import { getScene } from '../scenes/registry.js';
import VizCanvas from './VizCanvas.jsx';
import NarrativePanel from './NarrativePanel.jsx';
import HUD from './HUD.jsx';
import QueryBar from './QueryBar.jsx';
import ThinkingBubble from './ThinkingBubble.jsx';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function StoryView({ data }) {
  const [chapters, setChapters] = useState([]);
  const [activeChapter, setActiveChapter] = useState(0);
  const [scrollProgress, setScrollProgress] = useState({
    globalProgress: 0,
    chapterProgress: 0,
  });
  const narrativeRef = useRef(null);
  const scrollerRef = useRef(null);

  // Query intelligence state
  const [queryLoading, setQueryLoading] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState([]);
  const [thinkingActive, setThinkingActive] = useState(-1);
  const [vizDecision, setVizDecision] = useState(null);
  const [queryData, setQueryData] = useState(null);

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

    requestAnimationFrame(() => scroller.init());
    scrollerRef.current = scroller;
    return () => scroller.destroy();
  }, [chapters]);

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

  const handleQuery = useCallback(
    async (queryText) => {
      if (!data) return;

      setQueryLoading(true);
      setVizDecision(null);

      const rule = matchVizRule(queryText);
      const steps = buildThinkingSteps(queryText, rule);
      setThinkingSteps(steps);
      setThinkingActive(-1);

      for (let i = 0; i < steps.length; i++) {
        setThinkingActive(i);
        await sleep(550);
      }

      setVizDecision({ name: rule.name, reason: rule.reason });
      await sleep(400);

      const filtered = rule.dataFilter(data.accounts);
      const scene = getScene(rule.sceneId);

      if (!scene) {
        setQueryLoading(false);
        return;
      }

      const queryChapter = {
        sceneId: rule.sceneId,
        scene,
        title: rule.chapterTitle,
        body: rule.chapterBody(data, data.stats),
        insights: rule.insights(data.stats),
        isQuery: true,
      };

      const sceneData = rule.sceneId === 'chord-flows' ? data.flows : filtered;
      setQueryData(sceneData);

      setChapters((prev) => {
        const withoutQuery = prev.filter((c) => !c.isQuery);
        return [queryChapter, ...withoutQuery];
      });
      setActiveChapter(0);

      window.scrollTo({ top: 0, behavior: 'smooth' });
      setQueryLoading(false);
    },
    [data]
  );

  const activeScene = chapters[activeChapter]?.scene || null;
  const activeData = getActiveData(activeScene, activeChapter, chapters, data, queryData);

  return (
    <div className="story-view">
      <QueryBar onQuery={handleQuery} loading={queryLoading} />
      <ThinkingBubble
        steps={thinkingSteps}
        activeStep={thinkingActive}
        vizDecision={vizDecision}
        visible={queryLoading || vizDecision !== null}
      />
      <HUD
        currentChapter={activeChapter}
        totalChapters={chapters.length}
        globalProgress={scrollProgress.globalProgress}
        chapterProgress={scrollProgress.chapterProgress}
      />
      <div className="story-view__layout">
        <div className="story-view__sticky">
          <VizCanvas scene={activeScene} data={activeData} />
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

function getActiveData(scene, activeChapter, chapters, data, queryData) {
  if (!scene || !data) return null;

  if (chapters[activeChapter]?.isQuery && queryData) {
    return queryData;
  }

  switch (scene.id) {
    case 'chord-flows':
      return data.flows;
    default:
      return data.accounts;
  }
}
