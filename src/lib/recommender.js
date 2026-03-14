/**
 * AI Recommender — scores scene modules against a data shape
 *
 * Reads the data shape from databridge and scores each registered
 * scene module on how well it fits the available data, producing
 * an ordered "story arc" of chapters.
 */

import { getAllScenes } from '../scenes/registry.js';
import { getDataShape } from './databridge.js';

const SHAPE_WEIGHTS = {
  tabular: 1.0,
  temporal: 0.9,
  network: 0.8,
  hierarchical: 0.85,
};

const STORY_ARC_ORDER = [
  'force-network',
  'bubble-scatter',
  'radial-timeline',
  'treemap-arr',
  'chord-flows',
];

export function recommendScenes(data) {
  const shape = getDataShape(data);
  if (!shape) return [];

  const scenes = getAllScenes();
  const scored = scenes.map((scene) => ({
    ...scene,
    score: computeScore(scene, shape),
  }));

  scored.sort((a, b) => {
    const aIdx = STORY_ARC_ORDER.indexOf(a.id);
    const bIdx = STORY_ARC_ORDER.indexOf(b.id);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return b.score - a.score;
  });

  return scored.filter((s) => s.score > 0.2);
}

function computeScore(scene, shape) {
  let score = 0;

  const fieldMatch = scene.dataRequirements.fields.filter((f) =>
    shape.fields.includes(f)
  ).length / scene.dataRequirements.fields.length;
  score += fieldMatch * 0.4;

  if (shape.rowCount >= scene.dataRequirements.minRows) {
    score += 0.2;
  }

  const shapeBonus = scene.dataRequirements.shapes.reduce((best, s) => {
    if (s === 'temporal' && shape.hasTimeSeries) return Math.max(best, SHAPE_WEIGHTS[s]);
    if (s === 'network' && shape.rowCount >= 5) return Math.max(best, SHAPE_WEIGHTS[s]);
    if (s === 'hierarchical' && shape.categoricalFields.length >= 2) return Math.max(best, SHAPE_WEIGHTS[s]);
    if (s === 'tabular') return Math.max(best, SHAPE_WEIGHTS[s]);
    return best;
  }, 0);
  score += shapeBonus * 0.3;

  const numericRatio = shape.numericFields.length / shape.fields.length;
  score += numericRatio * 0.1;

  return Math.min(1, score);
}

export function generateNarrative(scene, stats) {
  const narratives = {
    'force-network': {
      title: 'The Account Universe',
      body: `Your portfolio of ${stats.totalAccounts} accounts forms an interconnected network. Accounts cluster by industry and region, revealing hidden dependencies. The ${stats.displayedAccounts} accounts shown here represent your highest-impact relationships.`,
      stat: `${stats.totalAccounts} accounts across ${stats.displayedAccounts} key segments`,
    },
    'bubble-scatter': {
      title: 'Health vs. Revenue',
      body: `Each bubble represents an account — size shows ARR, position reveals the tension between health score and engagement. The danger zone in the lower-left holds $${(stats.atRiskARR / 1e6).toFixed(1)}M in at-risk ARR.`,
      stat: `$${(stats.atRiskARR / 1e6).toFixed(1)}M at-risk ARR`,
    },
    'radial-timeline': {
      title: 'Signals Through Time',
      body: `Twelve months of customer signals radiate outward from the center. Watch how health scores pulse and engagement waxes and wanes — the rhythm of your customer base tells a story of resilience and risk.`,
      stat: `Average health: ${stats.avgHealth}/100`,
    },
    'treemap-arr': {
      title: 'Revenue Landscape',
      body: `Total ARR of $${(stats.totalARR / 1e6).toFixed(1)}M distributed across industries. The largest rectangles command attention, but the smallest often hold the greatest expansion potential.`,
      stat: `$${(stats.totalARR / 1e6).toFixed(1)}M total ARR`,
    },
    'chord-flows': {
      title: 'Cross-Segment Flows',
      body: `Regional connections between industry segments reveal where your go-to-market motion creates natural bridges. Thicker chords indicate stronger co-location patterns — opportunities for cross-sell and shared playbooks.`,
      stat: `${stats.renewalsSoon} renewals in next 90 days`,
    },
  };

  return narratives[scene.id] || {
    title: scene.name,
    body: scene.description,
    stat: '',
  };
}
