export default function NarrativePanel({ chapters, activeChapter, onSwapScene }) {
  return (
    <div className="narrative-panels">
      {chapters.map((chapter, idx) => (
        <div
          key={`${idx}-${chapter.sceneId}`}
          data-chapter={idx}
          className={`narrative-panel ${idx === activeChapter ? 'narrative-panel--active' : ''}`}
        >
          <div className="narrative-panel__inner">
            <span className="narrative-panel__chapter-num">
              Chapter {idx + 1}
            </span>
            <h2 className="narrative-panel__title">{chapter.title}</h2>
            <p className="narrative-panel__body">{chapter.body}</p>
            {chapter.insights && (
              <div className="narrative-panel__insights">
                {chapter.insights.map((ins, i) => (
                  <div key={i} className="narrative-panel__stat-block">
                    <span className="narrative-panel__stat-val" style={{ color: ins.color }}>
                      {ins.val}
                    </span>
                    <span className="narrative-panel__stat-lbl">{ins.label}</span>
                  </div>
                ))}
              </div>
            )}
            {!chapter.insights && chapter.stat && (
              <div className="narrative-panel__stat">{chapter.stat}</div>
            )}
            {onSwapScene && (
              <button
                className="narrative-panel__swap"
                onClick={() => onSwapScene(idx)}
                title="Swap visualization"
              >
                ↻ Swap viz
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
