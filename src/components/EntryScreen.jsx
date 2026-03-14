import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function EntryScreen({ onStart }) {
  const [appId, setAppId] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(canvasRef.current);
    const w = 320;
    const h = 200;

    svg.attr('viewBox', `0 0 ${w} ${h}`);

    const nodes = d3.range(30).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 2 + Math.random() * 5,
    }));

    const circles = svg
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', 0)
      .attr('fill', () =>
        d3.interpolateViridis(Math.random())
      )
      .attr('opacity', 0.4);

    circles
      .transition()
      .duration(1200)
      .delay((_, i) => i * 40)
      .ease(d3.easeElasticOut)
      .attr('r', (d) => d.r);

    function pulse() {
      circles
        .transition()
        .duration(2000 + Math.random() * 1500)
        .attr('cx', (d) => d.x + (Math.random() - 0.5) * 20)
        .attr('cy', (d) => d.y + (Math.random() - 0.5) * 15)
        .attr('opacity', () => 0.2 + Math.random() * 0.4)
        .transition()
        .duration(2000 + Math.random() * 1500)
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y)
        .attr('opacity', 0.4)
        .on('end', (_, i) => { if (i === 0) pulse(); });
    }
    pulse();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    onStart(appId.trim() || null);
  }

  return (
    <div className="entry-screen">
      <div className="entry-screen__content">
        <svg ref={canvasRef} className="entry-screen__preview" />
        <h1 className="entry-screen__title">Qlik Story Engine</h1>
        <p className="entry-screen__subtitle">
          Paste a Qlik App ID to generate a cinematic data story,
          or explore with demo data.
        </p>
        <form className="entry-screen__form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="entry-screen__input"
            placeholder="Qlik App ID (leave blank for demo)"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            autoFocus
          />
          <button type="submit" className="entry-screen__button">
            {appId.trim() ? 'Connect & Build Story' : 'Launch Demo Story'}
          </button>
        </form>
      </div>
    </div>
  );
}
