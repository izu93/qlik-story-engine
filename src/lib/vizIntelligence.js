/**
 * Viz Intelligence — maps natural language queries to D3 visualizations
 *
 * Each rule declares keywords, a data filter, the target scene,
 * and narrative content. matchVizRule() does keyword matching;
 * buildThinkingSteps() produces the animated reasoning sequence.
 */

export const VIZ_RULES = [
  {
    id: 'danger-scatter',
    name: 'Urgency Scatter',
    keywords: ['churn', 'risk', 'at risk', 'losing', 'danger', 'red', 'threat'],
    reason: 'Maps health vs ARR with churn-risk accounts in the danger zone. High-value at-risk accounts immediately visible.',
    dataFilter: (accounts) => accounts.filter((d) => d.signal === 'churn_risk' || d.healthScore < 40),
    sceneId: 'bubble-scatter',
    chapterTitle: 'Accounts Under Threat',
    chapterBody: (_, stats) =>
      `${stats?.redCount ?? 0} accounts show churn risk. At-risk ARR: $${((stats?.atRiskARR ?? 0) / 1e6).toFixed(1)}M. Accounts in the lower-left danger zone need immediate intervention.`,
    insights: (stats) => [
      { val: `$${((stats?.atRiskARR ?? 0) / 1e6).toFixed(1)}M`, label: 'At-risk ARR', color: 'var(--red)' },
      { val: stats?.redCount ?? 0, label: 'Churn risk accounts', color: 'var(--red)' },
    ],
  },
  {
    id: 'industry-treemap',
    name: 'ARR by Industry',
    keywords: ['industry', 'sector', 'vertical', 'edtech', 'fintech', 'devtools', 'healthtech', 'cyber', 'distribution'],
    reason: 'Treemap reveals part-to-whole ARR distribution. Nesting by industry then account shows macro and micro patterns simultaneously.',
    dataFilter: (accounts) => accounts,
    sceneId: 'treemap-arr',
    chapterTitle: 'Revenue Landscape',
    chapterBody: (_, stats) =>
      `$${((stats?.totalARR ?? 0) / 1e6).toFixed(1)}M ARR across 5 industries. Each rectangle is one account — size reflects ARR contribution to the portfolio.`,
    insights: (stats) => [
      { val: `$${((stats?.totalARR ?? 0) / 1e6).toFixed(1)}M`, label: 'Total ARR', color: 'var(--green)' },
      { val: stats?.displayedAccounts ?? 0, label: 'Accounts', color: 'var(--ink)' },
    ],
  },
  {
    id: 'health-scatter',
    name: 'Health vs Engagement',
    keywords: ['health', 'engagement', 'scatter', 'position', 'quadrant', 'map', 'all accounts'],
    reason: 'Two-axis scatter with quadrant overlays answers health/engagement questions. Bubble size adds ARR as a third dimension.',
    dataFilter: (accounts) => accounts,
    sceneId: 'bubble-scatter',
    chapterTitle: 'Health & Engagement Map',
    chapterBody: (_, stats) =>
      `All ${stats?.displayedAccounts ?? 0} accounts mapped by health vs engagement. Top-right champions, bottom-left danger zone holding $${((stats?.atRiskARR ?? 0) / 1e6).toFixed(1)}M at risk.`,
    insights: (stats) => [
      { val: stats?.avgHealth ?? 0, label: 'Avg health score', color: 'var(--amber)' },
      { val: stats?.greenCount ?? 0, label: 'Healthy accounts', color: 'var(--green)' },
    ],
  },
  {
    id: 'expansion-bubble',
    name: 'Expansion Opportunities',
    keywords: ['expansion', 'grow', 'upsell', 'potential', 'champion', 'best', 'opportunity'],
    reason: 'Filters to expansion-signal accounts. Green zone top-right makes champions immediately visible.',
    dataFilter: (accounts) => accounts.filter((d) => d.signal === 'expansion' || d.healthScore > 75),
    sceneId: 'bubble-scatter',
    chapterTitle: 'Expansion Opportunities',
    chapterBody: (_, stats) =>
      `${stats?.greenCount ?? 0} accounts showing healthy or expansion signals. These are your upsell and cross-sell targets with strong engagement and growing usage.`,
    insights: (stats) => [
      { val: stats?.greenCount ?? 0, label: 'Expansion targets', color: 'var(--green)' },
      { val: `$${(((stats?.totalARR ?? 0) - (stats?.atRiskARR ?? 0)) / 1e6).toFixed(1)}M`, label: 'Healthy ARR', color: 'var(--green)' },
    ],
  },
  {
    id: 'renewal-network',
    name: 'Renewal Risk Network',
    keywords: ['renew', 'renewal', 'expir', '90 day', 'upcoming', 'soon', 'contract'],
    reason: 'Force graph clusters renewal-at-risk accounts. Network reveals which CSMs own the most urgent renewals.',
    dataFilter: (accounts) => accounts.filter((d) => d.renewalDays > 0 && d.renewalDays < 180),
    sceneId: 'force-network',
    chapterTitle: 'Renewal Urgency',
    chapterBody: (_, stats) =>
      `Accounts with renewals inside 180 days. Node size = ARR. Color = signal. Clusters reveal CSM workload concentration.`,
    insights: (stats) => [
      { val: stats?.renewalsSoon ?? 0, label: 'Renewing \u226490d', color: 'var(--amber)' },
      { val: stats?.redCount ?? 0, label: 'At-risk renewals', color: 'var(--red)' },
    ],
  },
  {
    id: 'signal-chord',
    name: 'Cross-Segment Flows',
    keywords: ['segment', 'flow', 'cross', 'industry flow', 'connect', 'chord', 'between'],
    reason: 'Chord diagram maps cross-industry account relationships. Thicker chords = stronger regional co-location.',
    dataFilter: (accounts) => accounts,
    sceneId: 'chord-flows',
    chapterTitle: 'Cross-Segment Flows',
    chapterBody: () =>
      `Regional connections between industry segments reveal go-to-market bridges and cross-sell opportunities.`,
    insights: (stats) => [
      { val: '5', label: 'Industry segments', color: 'var(--blue)' },
      { val: stats?.totalAccounts ?? 0, label: 'Total accounts', color: 'var(--ink)' },
    ],
  },
  {
    id: 'portfolio-force',
    name: 'Account Universe',
    keywords: ['universe', 'all', 'portfolio', 'network', 'overview', 'everything', 'full'],
    reason: 'Force graph of all accounts. Nodes cluster by industry, sized by ARR, colored by signal. Best for portfolio-level pattern recognition.',
    dataFilter: (accounts) => accounts,
    sceneId: 'force-network',
    chapterTitle: 'The Account Universe',
    chapterBody: (_, stats) =>
      `All ${stats?.displayedAccounts ?? 0} accounts as a living network. Clusters by industry reveal structural patterns invisible in tables.`,
    insights: (stats) => [
      { val: stats?.displayedAccounts ?? 0, label: 'Accounts', color: 'var(--ink)' },
      { val: `$${((stats?.totalARR ?? 0) / 1e6).toFixed(1)}M`, label: 'Total ARR', color: 'var(--green)' },
    ],
  },
  {
    id: 'radial-signals',
    name: 'Signal Radar',
    keywords: ['signal', 'radar', 'radial', 'time', 'trend', 'monthly', 'over time', 'pulse'],
    reason: 'Radial timeline shows 12 months of health and engagement signals. Seasonal patterns and drift become visible.',
    dataFilter: (accounts) => accounts,
    sceneId: 'radial-timeline',
    chapterTitle: 'Signals Through Time',
    chapterBody: (_, stats) =>
      `Twelve months of portfolio signals radiate outward. Watch how health scores pulse and engagement waxes and wanes across the year.`,
    insights: (stats) => [
      { val: stats?.avgHealth ?? 0, label: 'Avg health', color: 'var(--amber)' },
      { val: stats?.churned ?? 0, label: 'Churned accounts', color: 'var(--red)' },
    ],
  },
];

export function matchVizRule(query) {
  const q = query.toLowerCase();
  for (const rule of VIZ_RULES) {
    if (rule.keywords.some((k) => q.includes(k))) return rule;
  }
  return VIZ_RULES[2]; // default: health scatter
}

export function buildThinkingSteps(query, rule) {
  return [
    `Parsing query: "${query.slice(0, 45)}${query.length > 45 ? '\u2026' : ''}"`,
    `Analyzing data shape \u2014 500 accounts, 5 industries, 6 signals`,
    `Checking viz options: scatter, treemap, force graph, radial, chord...`,
    `Evaluating: scatter plot, treemap, force graph, radial...`,
    `Best match: ${rule.name}`,
    `Reason: ${rule.reason.slice(0, 60)}...`,
    `Filtering dataset and rendering...`,
  ];
}
