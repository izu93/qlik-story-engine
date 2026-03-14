import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { registerScene } from './registry.js';

const SIGNAL_COLORS = {
  churn_risk: '#ef4444',
  expansion: '#22c55e',
  healthy: '#3b82f6',
  adoption_lag: '#f59e0b',
  renewal_imminent: '#a855f7',
};

function SceneForce({ data, width, height, onHover, onLeave }) {
  const svgRef = useRef(null);
  const simRef = useRef(null);

  useEffect(() => {
    if (!data?.length || !width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const arrExtent = d3.extent(data, (d) => d.arr);
    const rScale = d3.scaleSqrt().domain(arrExtent).range([6, 36]);

    const nodes = data.map((d) => ({ ...d }));
    const links = buildLinks(nodes);

    const g = svg.append('g');

    const link = g
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#334155')
      .attr('stroke-opacity', 0)
      .attr('stroke-width', (d) => d.strength * 2);

    const node = g
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 0)
      .attr('fill', (d) => SIGNAL_COLORS[d.signal] || '#64748b')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1.5)
      .attr('cursor', 'pointer')
      .on('mouseenter', (e, d) => onHover?.(d, e))
      .on('mouseleave', () => onLeave?.());

    const labels = g
      .selectAll('text')
      .data(nodes.filter((d) => d.arr > 2000000))
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => -rScale(d.arr) - 6)
      .attr('fill', '#cbd5e1')
      .attr('font-size', 10)
      .attr('opacity', 0)
      .text((d) => d.name.split(' ')[0]);

    const sim = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(80).strength((d) => d.strength * 0.3))
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => rScale(d.arr) + 4))
      .on('tick', () => {
        link
          .attr('x1', (d) => d.source.x)
          .attr('y1', (d) => d.source.y)
          .attr('x2', (d) => d.target.x)
          .attr('y2', (d) => d.target.y);
        node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
        labels.attr('x', (d) => d.x).attr('y', (d) => d.y);
      });

    simRef.current = sim;

    // enter transitions
    node
      .transition()
      .duration(800)
      .delay((_, i) => i * 30)
      .attr('r', (d) => rScale(d.arr));

    link
      .transition()
      .duration(600)
      .delay(400)
      .attr('stroke-opacity', 0.3);

    labels
      .transition()
      .duration(500)
      .delay(900)
      .attr('opacity', 0.8);

    // drag behavior
    node.call(
      d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
    );

    return () => {
      // exit transition
      node.transition().duration(400).attr('r', 0);
      link.transition().duration(300).attr('stroke-opacity', 0);
      sim.stop();
    };
  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
}

function buildLinks(nodes) {
  const links = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      let strength = 0;
      if (a.industry === b.industry) strength += 0.5;
      if (a.region === b.region) strength += 0.3;
      if (a.signal === b.signal) strength += 0.2;
      if (strength > 0.4) {
        links.push({ source: a.id, target: b.id, strength });
      }
    }
  }
  return links;
}

const sceneModule = {
  id: 'force-network',
  name: 'Account Network',
  description: 'Force-directed graph showing account relationships by industry, region, and signal type.',
  dataRequirements: {
    fields: ['name', 'industry', 'region', 'arr', 'signal'],
    minRows: 5,
    shapes: ['network', 'tabular'],
  },
  component: SceneForce,
};

registerScene(sceneModule);
export default sceneModule;
