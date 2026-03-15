export default function ThinkingBubble({ steps, activeStep, vizDecision, visible }) {
  if (!visible || !steps.length) return null;

  return (
    <div className="thinking-bubble">
      <div className="thinking-bubble__header">
        <span className="thinking-bubble__icon">{'\u2726'}</span>
        <span className="thinking-bubble__title">Claude is reasoning</span>
      </div>
      <div className="thinking-bubble__steps">
        {steps.map((step, i) => {
          const state = i < activeStep ? 'done' : i === activeStep ? 'active' : '';
          return (
            <div key={i} className={`thinking-step ${state ? `thinking-step--${state}` : ''}`}>
              <span className="thinking-step__dot" />
              <span>{step}</span>
            </div>
          );
        })}
      </div>
      {vizDecision && (
        <div className="viz-decision">
          <div className="viz-decision__label">Visualization Decision</div>
          <div className="viz-decision__text">
            <strong>{vizDecision.name}</strong> &mdash; {vizDecision.reason}
          </div>
        </div>
      )}
    </div>
  );
}
