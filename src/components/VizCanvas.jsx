import { useRef, useState, useEffect } from 'react';
import Tooltip, { useTooltip } from './Tooltip.jsx';

export default function VizCanvas({ scene, data }) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const { tooltip, showTooltip, hideTooltip } = useTooltip();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ width: Math.floor(width), height: Math.floor(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const SceneComponent = scene?.component;

  return (
    <div ref={containerRef} className="viz-canvas">
      {SceneComponent && dims.width > 0 && (
        <SceneComponent
          key={scene.id}
          data={data}
          width={dims.width}
          height={dims.height}
          onHover={showTooltip}
          onLeave={hideTooltip}
        />
      )}
      {!SceneComponent && (
        <div className="viz-canvas__empty">
          <div className="viz-canvas__empty-icon">◇</div>
          <p>Select a chapter to begin</p>
        </div>
      )}
      <Tooltip tooltip={tooltip} />
    </div>
  );
}
