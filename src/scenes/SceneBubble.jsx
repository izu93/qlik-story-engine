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

function SceneBubble({ data, width, height, onHover, onLeave }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data?.length || !width || !height) return;

    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, 100]).range([0, w]);
    const y = d3.scaleLinear().domain([0, 100]).range([h, 0]);
    const r = d3.scaleSqrt()
      .domain(d3.extent(data, (d) => d.arr))
      .range([5, 40]);

    // danger zone
    g.append('rect')
      .attr('x', x(0))
      .attr('y', y(50))
      .attr('width', x(50))
      .attr('height', h - y(50))
      .attr('fill', '#ef4444')
      .attr('opacity', 0)
      .transition()
      .duration(600)
      .attr('opacity', 0.06);

    // axes
    const xAxis = g
      .append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(5))
      .attr('opacity', 0);
    xAxis.transition().duration(500).attr('opacity', 0.6);

    const yAxis = g
      .append('g')
      .call(d3.axisLeft(y).ticks(5))
      .attr('opacity', 0);
    yAxis.transition().duration(500).attr('opacity', 0.6);

    // axis labels
    g.append('text')
      .attr('x', w / 2)
      .attr('y', h + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', 12)
      .text('Engagement Score');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -h / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', 12)
      .text('Health Score');

    // style axes
    g.selectAll('.domain, .tick line').attr('stroke', '#334155');
    g.selectAll('.tick text').attr('fill', '#64748b');

    // bubbles
    const bubbles = g
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', (d) => x(d.engagementScore))
      .attr('cy', (d) => y(d.healthScore))
      .attr('r', 0)
      .attr('fill', (d) => SIGNAL_COLORS[d.signal] || '#64748b')
      .attr('fill-opacity', 0.7)
      .attr('stroke', (d) => SIGNAL_COLORS[d.signal] || '#64748b')
      .attr('stroke-width', 1.5)
      .attr('cursor', 'pointer')
      .on('mouseenter', (e, d) => onHover?.(d, e))
      .on('mouseleave', () => onLeave?.());

    // enter
    bubbles
      .transition()
      .duration(700)
      .delay((_, i) => i * 25)
      .ease(d3.easeElasticOut.amplitude(1).period(0.5))
      .attr('r', (d) => r(d.arr));

    // labels for large accounts
    g.selectAll('.bubble-label')
      .data(data.filter((d) => d.arr > 2500000))
      .join('text')
      .attr('class', 'bubble-label')
      .attr('x', (d) => x(d.engagementScore))
      .attr('y', (d) => y(d.healthScore) - r(d.arr) - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', '#cbd5e1')
      .attr('font-size', 10)
      .attr('opacity', 0)
      .text((d) => d.name.split(' ')[0])
      .transition()
      .delay(800)
      .duration(400)
      .attr('opacity', 0.8);

    return () => {
      bubbles.transition().duration(400).attr('r', 0);
    };
  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
}

const sceneModule = {
  id: 'bubble-scatter',
  name: 'Health vs. ARR',
  description: 'Bubble scatter plot mapping health scores against engagement, sized by ARR.',
  dataRequirements: {
    fields: ['healthScore', 'engagementScore', 'arr', 'signal'],
    minRows: 3,
    shapes: ['tabular'],
  },
  component: SceneBubble,
};

registerScene(sceneModule);
export default sceneModule;
