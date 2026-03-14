import { useState, useCallback } from 'react';

export function useTooltip() {
  const [tooltip, setTooltip] = useState(null);

  const showTooltip = useCallback((datum, event) => {
    const x = event?.clientX ?? event?.pageX ?? 0;
    const y = event?.clientY ?? event?.pageY ?? 0;
    setTooltip({ datum, x, y });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  return { tooltip, showTooltip, hideTooltip };
}

export default function Tooltip({ tooltip }) {
  if (!tooltip) return null;

  const { datum, x, y } = tooltip;

  const style = {
    position: 'fixed',
    left: x + 14,
    top: y - 10,
    pointerEvents: 'none',
    zIndex: 1000,
  };

  return (
    <div className="tooltip" style={style}>
      <div className="tooltip-inner">
        {datum.name && <div className="tooltip-title">{datum.name}</div>}
        {datum.arr != null && (
          <div className="tooltip-row">
            <span className="tooltip-label">ARR</span>
            <span className="tooltip-value">${(datum.arr / 1e6).toFixed(2)}M</span>
          </div>
        )}
        {datum.healthScore != null && (
          <div className="tooltip-row">
            <span className="tooltip-label">Health</span>
            <span className="tooltip-value">{datum.healthScore}/100</span>
          </div>
        )}
        {datum.engagementScore != null && (
          <div className="tooltip-row">
            <span className="tooltip-label">Engagement</span>
            <span className="tooltip-value">{datum.engagementScore}/100</span>
          </div>
        )}
        {datum.signal && (
          <div className="tooltip-row">
            <span className="tooltip-label">Signal</span>
            <span className={`tooltip-signal tooltip-signal--${datum.signal}`}>
              {datum.signal.replace(/_/g, ' ')}
            </span>
          </div>
        )}
        {datum.industry && (
          <div className="tooltip-row">
            <span className="tooltip-label">Industry</span>
            <span className="tooltip-value">{datum.industry}</span>
          </div>
        )}
        {datum.source && datum.target && (
          <>
            <div className="tooltip-title">{datum.source} → {datum.target}</div>
            <div className="tooltip-row">
              <span className="tooltip-label">Flow</span>
              <span className="tooltip-value">{datum.value?.toLocaleString()}</span>
            </div>
          </>
        )}
        {datum.month && (
          <>
            <div className="tooltip-title">Month: {datum.month}</div>
            {datum.avgHealth != null && (
              <div className="tooltip-row">
                <span className="tooltip-label">Avg Health</span>
                <span className="tooltip-value">{Math.round(datum.avgHealth)}</span>
              </div>
            )}
            {datum.totalCases != null && (
              <div className="tooltip-row">
                <span className="tooltip-label">Cases</span>
                <span className="tooltip-value">{datum.totalCases}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
