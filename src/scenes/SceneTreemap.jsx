import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { registerScene } from './registry.js';

const INDUSTRY_COLORS = {
  Healthcare: '#ef4444',
  'Financial Services': '#3b82f6',
  Technology: '#22c55e',
  Energy: '#f59e0b',
  Transportation: '#8b5cf6',
  Retail: '#ec4899',
  Manufacturing: '#14b8a6',
  Media: '#f97316',
  Education: '#06b6d4',
  Government: '#64748b',
  Construction: '#a3a3a3',
};

function SceneTreemap({ data, width, height, onHover, onLeave }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data?.length || !width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const grouped = d3.groups(data, (d) => d.industry);
    const hierarchy = d3
      .hierarchy({
        name: 'root',
        children: grouped.map(([industry, accounts]) => ({
          name: industry,
          children: accounts.map((a) => ({ name: a.name, value: a.arr, ...a })),
        })),
      })
      .sum((d) => d.value || 0)
      .sort((a, b) => b.value - a.value);

    const treemap = d3
      .treemap()
      .size([width, height])
      .padding(2)
      .paddingOuter(4)
      .round(true);

    treemap(hierarchy);

    const leaves = hierarchy.leaves();

    const g = svg.append('g');

    // industry group backgrounds
    g.selectAll('.industry-bg')
      .data(hierarchy.children || [])
      .join('rect')
      .attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0)
      .attr('fill', (d) => INDUSTRY_COLORS[d.data.name] || '#64748b')
      .attr('fill-opacity', 0.08)
      .attr('stroke', (d) => INDUSTRY_COLORS[d.data.name] || '#64748b')
      .attr('stroke-opacity', 0.3)
      .attr('rx', 3);

    // leaf cells
    const cells = g
      .selectAll('.leaf')
      .data(leaves)
      .join('g')
      .attr('class', 'leaf')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`);

    const rects = cells
      .append('rect')
      .attr('width', (d) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d) => Math.max(0, d.y1 - d.y0))
      .attr('fill', (d) => INDUSTRY_COLORS[d.parent?.data.name] || '#64748b')
      .attr('fill-opacity', 0)
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1)
      .attr('rx', 2)
      .attr('cursor', 'pointer')
      .on('mouseenter', (e, d) => onHover?.(d.data, e))
      .on('mouseleave', () => onLeave?.());

    // text labels (only for cells large enough)
    cells
      .filter((d) => d.x1 - d.x0 > 60 && d.y1 - d.y0 > 28)
      .append('text')
      .attr('x', 6)
      .attr('y', 16)
      .attr('fill', '#e2e8f0')
      .attr('font-size', (d) => (d.x1 - d.x0 > 120 ? 11 : 9))
      .attr('opacity', 0)
      .text((d) => {
        const maxChars = Math.floor((d.x1 - d.x0 - 12) / 6);
        const name = d.data.name;
        return name.length > maxChars ? name.slice(0, maxChars - 1) + '…' : name;
      })
      .transition()
      .delay(600)
      .duration(400)
      .attr('opacity', 0.9);

    // ARR value labels
    cells
      .filter((d) => d.x1 - d.x0 > 60 && d.y1 - d.y0 > 44)
      .append('text')
      .attr('x', 6)
      .attr('y', 30)
      .attr('fill', '#94a3b8')
      .attr('font-size', 9)
      .attr('opacity', 0)
      .text((d) => `$${(d.data.arr / 1e6).toFixed(1)}M`)
      .transition()
      .delay(700)
      .duration(400)
      .attr('opacity', 0.7);

    // enter transition
    rects
      .transition()
      .duration(600)
      .delay((_, i) => i * 20)
      .ease(d3.easeCubicOut)
      .attr('fill-opacity', 0.65);

    // industry labels
    g.selectAll('.industry-label')
      .data(hierarchy.children?.filter((d) => d.x1 - d.x0 > 80) || [])
      .join('text')
      .attr('class', 'industry-label')
      .attr('x', (d) => d.x0 + 5)
      .attr('y', (d) => d.y0 - 5)
      .attr('fill', (d) => INDUSTRY_COLORS[d.data.name] || '#94a3b8')
      .attr('font-size', 10)
      .attr('font-weight', 600)
      .attr('opacity', 0)
      .text((d) => d.data.name)
      .transition()
      .delay(400)
      .duration(500)
      .attr('opacity', 0.8);

    return () => {
      rects.transition().duration(400).attr('fill-opacity', 0);
    };
  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
}

const sceneModule = {
  id: 'treemap-arr',
  name: 'ARR by Industry',
  description: 'Treemap visualization of Annual Recurring Revenue distributed across industries and accounts.',
  dataRequirements: {
    fields: ['name', 'industry', 'arr'],
    minRows: 3,
    shapes: ['hierarchical', 'tabular'],
  },
  component: SceneTreemap,
};

registerScene(sceneModule);
export default sceneModule;
