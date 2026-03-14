import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { registerScene } from './registry.js';

const SEGMENT_COLORS = [
  '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#64748b', '#a3a3a3',
];

function SceneChord({ data, width, height, onHover, onLeave }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data?.labels || !data?.matrix || !width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { labels, matrix } = data;
    const outerRadius = Math.min(width, height) / 2 - 60;
    const innerRadius = outerRadius - 20;

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const chord = d3
      .chord()
      .padAngle(0.04)
      .sortSubgroups(d3.descending);

    const chords = chord(matrix);

    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
    const ribbon = d3.ribbon().radius(innerRadius);

    const color = d3.scaleOrdinal().domain(d3.range(labels.length)).range(SEGMENT_COLORS);

    // arcs (industry segments)
    const groups = g
      .selectAll('.arc')
      .data(chords.groups)
      .join('g')
      .attr('class', 'arc');

    const arcPaths = groups
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => color(d.index))
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0);

    // arc labels
    groups
      .append('text')
      .each((d) => { d.angle = (d.startAngle + d.endAngle) / 2; })
      .attr('dy', '0.35em')
      .attr('transform', (d) =>
        `rotate(${(d.angle * 180) / Math.PI - 90}) translate(${outerRadius + 12})${d.angle > Math.PI ? ' rotate(180)' : ''}`
      )
      .attr('text-anchor', (d) => (d.angle > Math.PI ? 'end' : 'start'))
      .attr('fill', '#94a3b8')
      .attr('font-size', 10)
      .attr('opacity', 0)
      .text((d) => labels[d.index]);

    // ribbons (flows between segments)
    const ribbons = g
      .selectAll('.ribbon')
      .data(chords)
      .join('path')
      .attr('class', 'ribbon')
      .attr('d', ribbon)
      .attr('fill', (d) => color(d.source.index))
      .attr('fill-opacity', 0)
      .attr('stroke', (d) => d3.color(color(d.source.index)).darker(0.5))
      .attr('stroke-opacity', 0)
      .attr('stroke-width', 0.5)
      .attr('cursor', 'pointer')
      .on('mouseenter', (e, d) => {
        ribbons.attr('fill-opacity', 0.08);
        d3.select(e.currentTarget).attr('fill-opacity', 0.6);
        onHover?.(
          {
            source: labels[d.source.index],
            target: labels[d.target.index],
            value: d.source.value,
          },
          e
        );
      })
      .on('mouseleave', () => {
        ribbons.attr('fill-opacity', 0.35);
        onLeave?.();
      });

    // enter transitions
    arcPaths
      .transition()
      .duration(700)
      .delay((_, i) => i * 60)
      .attr('opacity', 0.85);

    groups
      .selectAll('text')
      .transition()
      .delay(600)
      .duration(400)
      .attr('opacity', 0.8);

    ribbons
      .transition()
      .delay(500)
      .duration(800)
      .attr('fill-opacity', 0.35)
      .attr('stroke-opacity', 0.2);

    return () => {
      arcPaths.transition().duration(300).attr('opacity', 0);
      ribbons.transition().duration(300).attr('fill-opacity', 0);
    };
  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
}

const sceneModule = {
  id: 'chord-flows',
  name: 'Cross-Segment Flows',
  description: 'Chord diagram showing regional flow patterns between industry segments.',
  dataRequirements: {
    fields: ['industry', 'region', 'arr'],
    minRows: 5,
    shapes: ['network', 'tabular'],
  },
  component: SceneChord,
};

registerScene(sceneModule);
export default sceneModule;
