import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { registerScene } from './registry.js';

function SceneRadial({ data, width, height, onHover, onLeave }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data?.length || !width || !height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const cx = width / 2;
    const cy = height / 2;
    const outerRadius = Math.min(cx, cy) - 40;
    const innerRadius = outerRadius * 0.25;

    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);

    // aggregate monthly data across top accounts
    const monthlyAgg = Array.from({ length: 12 }, (_, i) => {
      const monthData = data.map((d) => d.monthlyData?.[i]).filter(Boolean);
      return {
        month: monthData[0]?.month || `2025-${String(i + 1).padStart(2, '0')}`,
        avgHealth: d3.mean(monthData, (d) => d.health) || 0,
        avgEngagement: d3.mean(monthData, (d) => d.engagement) || 0,
        totalCases: d3.sum(monthData, (d) => d.cases),
        totalArr: d3.sum(monthData, (d) => d.arr),
      };
    });

    const angleScale = d3
      .scaleBand()
      .domain(monthlyAgg.map((d) => d.month))
      .range([0, 2 * Math.PI]);

    const healthRadius = d3
      .scaleLinear()
      .domain([0, 100])
      .range([innerRadius, outerRadius]);

    const engagementRadius = d3
      .scaleLinear()
      .domain([0, 100])
      .range([innerRadius, outerRadius]);

    // grid rings
    const gridValues = [25, 50, 75, 100];
    g.selectAll('.grid-ring')
      .data(gridValues)
      .join('circle')
      .attr('r', (d) => healthRadius(d))
      .attr('fill', 'none')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '2,4');

    // grid labels
    g.selectAll('.grid-label')
      .data(gridValues)
      .join('text')
      .attr('y', (d) => -healthRadius(d) - 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#475569')
      .attr('font-size', 9)
      .text((d) => d);

    // month labels
    g.selectAll('.month-label')
      .data(monthlyAgg)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('transform', (d) => {
        const a = angleScale(d.month) + angleScale.bandwidth() / 2 - Math.PI / 2;
        const r = outerRadius + 20;
        return `translate(${r * Math.cos(a)},${r * Math.sin(a)})`;
      })
      .attr('fill', '#94a3b8')
      .attr('font-size', 10)
      .text((d) => d.month.slice(5));

    // health area
    const healthLine = d3
      .lineRadial()
      .angle((d) => angleScale(d.month) + angleScale.bandwidth() / 2)
      .radius((d) => healthRadius(d.avgHealth))
      .curve(d3.curveCardinalClosed);

    const healthPath = g
      .append('path')
      .datum(monthlyAgg)
      .attr('fill', '#3b82f6')
      .attr('fill-opacity', 0.15)
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', healthLine);

    // engagement area
    const engLine = d3
      .lineRadial()
      .angle((d) => angleScale(d.month) + angleScale.bandwidth() / 2)
      .radius((d) => engagementRadius(d.avgEngagement))
      .curve(d3.curveCardinalClosed);

    const engPath = g
      .append('path')
      .datum(monthlyAgg)
      .attr('fill', '#22c55e')
      .attr('fill-opacity', 0.1)
      .attr('stroke', '#22c55e')
      .attr('stroke-width', 2)
      .attr('d', engLine);

    // case spikes (bars radiating outward)
    const maxCases = d3.max(monthlyAgg, (d) => d.totalCases);
    const caseScale = d3.scaleLinear().domain([0, maxCases]).range([0, 20]);

    const caseBars = g
      .selectAll('.case-bar')
      .data(monthlyAgg)
      .join('rect')
      .attr('class', 'case-bar')
      .attr('transform', (d) => {
        const a = (angleScale(d.month) + angleScale.bandwidth() / 2) * (180 / Math.PI) - 90;
        return `rotate(${a})`;
      })
      .attr('x', -2)
      .attr('y', -innerRadius)
      .attr('width', 4)
      .attr('height', 0)
      .attr('fill', '#f59e0b')
      .attr('opacity', 0.6);

    // dots at health data points
    const dots = g
      .selectAll('.health-dot')
      .data(monthlyAgg)
      .join('circle')
      .attr('class', 'health-dot')
      .attr('cx', (d) => {
        const a = angleScale(d.month) + angleScale.bandwidth() / 2 - Math.PI / 2;
        return healthRadius(d.avgHealth) * Math.cos(a);
      })
      .attr('cy', (d) => {
        const a = angleScale(d.month) + angleScale.bandwidth() / 2 - Math.PI / 2;
        return healthRadius(d.avgHealth) * Math.sin(a);
      })
      .attr('r', 0)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1.5)
      .attr('cursor', 'pointer')
      .on('mouseenter', (e, d) => onHover?.(d, e))
      .on('mouseleave', () => onLeave?.());

    // enter transitions
    const pathLength = healthPath.node().getTotalLength();
    healthPath
      .attr('stroke-dasharray', `${pathLength} ${pathLength}`)
      .attr('stroke-dashoffset', pathLength)
      .attr('fill-opacity', 0)
      .transition()
      .duration(1200)
      .ease(d3.easeQuadOut)
      .attr('stroke-dashoffset', 0)
      .transition()
      .duration(400)
      .attr('fill-opacity', 0.15);

    const engLength = engPath.node().getTotalLength();
    engPath
      .attr('stroke-dasharray', `${engLength} ${engLength}`)
      .attr('stroke-dashoffset', engLength)
      .attr('fill-opacity', 0)
      .transition()
      .delay(400)
      .duration(1200)
      .ease(d3.easeQuadOut)
      .attr('stroke-dashoffset', 0)
      .transition()
      .duration(400)
      .attr('fill-opacity', 0.1);

    dots
      .transition()
      .delay((_, i) => 600 + i * 60)
      .duration(300)
      .attr('r', 4);

    caseBars
      .transition()
      .delay((_, i) => 800 + i * 50)
      .duration(400)
      .attr('height', (d) => caseScale(d.totalCases));

    // legend
    const legend = svg.append('g').attr('transform', `translate(20, 20)`);
    [
      { label: 'Health', color: '#3b82f6' },
      { label: 'Engagement', color: '#22c55e' },
      { label: 'Cases', color: '#f59e0b' },
    ].forEach(({ label, color }, i) => {
      legend
        .append('rect')
        .attr('x', 0)
        .attr('y', i * 18)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', color)
        .attr('rx', 2);
      legend
        .append('text')
        .attr('x', 18)
        .attr('y', i * 18 + 10)
        .attr('fill', '#94a3b8')
        .attr('font-size', 11)
        .text(label);
    });

    return () => {
      healthPath.transition().duration(300).attr('opacity', 0);
      engPath.transition().duration(300).attr('opacity', 0);
      dots.transition().duration(300).attr('r', 0);
    };
  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
}

const sceneModule = {
  id: 'radial-timeline',
  name: 'Monthly Signal Radar',
  description: 'Radial timeline showing 12 months of health, engagement, and support case trends.',
  dataRequirements: {
    fields: ['monthlyData'],
    minRows: 3,
    shapes: ['temporal'],
  },
  component: SceneRadial,
};

registerScene(sceneModule);
export default sceneModule;
