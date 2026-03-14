export default function HUD({ currentChapter, totalChapters, globalProgress, chapterProgress }) {
  return (
    <div className="hud">
      <div className="hud__progress-track">
        <div
          className="hud__progress-fill"
          style={{ width: `${(globalProgress || 0) * 100}%` }}
        />
      </div>
      <div className="hud__info">
        <span className="hud__chapter">
          {currentChapter >= 0
            ? `Chapter ${currentChapter + 1} / ${totalChapters}`
            : 'Scroll to begin'}
        </span>
        {currentChapter >= 0 && (
          <span className="hud__chapter-progress">
            {Math.round((chapterProgress || 0) * 100)}%
          </span>
        )}
      </div>
    </div>
  );
}
