/**
 * Data Bridge — Qlik MCP connector + demo data fallback
 *
 * In production: connects to Qlik Cloud via MCP tool calls.
 * In demo mode:  returns static data that mirrors a real
 *                Customer Signal Dashboard (~25 key accounts).
 *
 * Aggregate stats modeled after:
 *   Total ARR  ~$43.8M   |  390 accounts (we show top 25)
 *   At-risk ARR ~$8.2M   |  Renewals ≤90d: 47
 */

// ─── Demo dataset ────────────────────────────────────────────────────

function monthlyTrend(base, volatility = 0.08, trend = 0) {
  const months = [];
  let val = base;
  for (let i = 0; i < 12; i++) {
    val = val * (1 + trend / 12) + (Math.random() - 0.5) * base * volatility;
    months.push({
      month: new Date(2025, i, 1).toISOString().slice(0, 7),
      arr: Math.round(val),
      health: Math.min(100, Math.max(0, Math.round(70 + (Math.random() - 0.4) * 30))),
      engagement: Math.min(100, Math.max(0, Math.round(60 + (Math.random() - 0.3) * 40))),
      cases: Math.max(0, Math.round(Math.random() * 8)),
    });
  }
  return months;
}

const DEMO_ACCOUNTS = [
  { name: 'Meridian Health Systems',   industry: 'Healthcare',       region: 'North America', arr: 4200000, healthScore: 42, engagementScore: 38, signal: 'churn_risk',        cases: 14, csat: 5.8, renewalDays: 28 },
  { name: 'Apex Financial Group',      industry: 'Financial Services',region: 'North America', arr: 3800000, healthScore: 88, engagementScore: 92, signal: 'expansion',         cases: 2,  csat: 9.1, renewalDays: 180 },
  { name: 'TerraVolt Energy',          industry: 'Energy',           region: 'EMEA',          arr: 3100000, healthScore: 71, engagementScore: 65, signal: 'healthy',            cases: 5,  csat: 7.9, renewalDays: 220 },
  { name: 'NovaBridge Logistics',      industry: 'Transportation',   region: 'North America', arr: 2900000, healthScore: 55, engagementScore: 44, signal: 'adoption_lag',       cases: 9,  csat: 6.5, renewalDays: 67 },
  { name: 'ClearView Analytics',       industry: 'Technology',       region: 'North America', arr: 2750000, healthScore: 94, engagementScore: 96, signal: 'expansion',          cases: 1,  csat: 9.4, renewalDays: 310 },
  { name: 'Greenfield Pharma',         industry: 'Healthcare',       region: 'EMEA',          arr: 2600000, healthScore: 63, engagementScore: 58, signal: 'renewal_imminent',   cases: 7,  csat: 7.1, renewalDays: 14 },
  { name: 'Pinnacle Retail Corp',      industry: 'Retail',           region: 'North America', arr: 2400000, healthScore: 78, engagementScore: 82, signal: 'healthy',            cases: 3,  csat: 8.3, renewalDays: 145 },
  { name: 'Stratos Aerospace',         industry: 'Manufacturing',    region: 'North America', arr: 2200000, healthScore: 36, engagementScore: 28, signal: 'churn_risk',         cases: 18, csat: 4.9, renewalDays: 42 },
  { name: 'Baltic Shipping AG',        industry: 'Transportation',   region: 'EMEA',          arr: 1950000, healthScore: 82, engagementScore: 79, signal: 'healthy',            cases: 4,  csat: 8.0, renewalDays: 200 },
  { name: 'SilverOak Insurance',       industry: 'Financial Services',region: 'North America', arr: 1850000, healthScore: 47, engagementScore: 40, signal: 'churn_risk',        cases: 11, csat: 5.5, renewalDays: 55 },
  { name: 'Cascade Media Group',       industry: 'Media',            region: 'North America', arr: 1700000, healthScore: 90, engagementScore: 88, signal: 'expansion',          cases: 1,  csat: 9.2, renewalDays: 260 },
  { name: 'Pacifica Telecom',          industry: 'Technology',       region: 'APAC',          arr: 1600000, healthScore: 73, engagementScore: 70, signal: 'healthy',            cases: 6,  csat: 7.6, renewalDays: 190 },
  { name: 'Atlas Construction',        industry: 'Construction',     region: 'North America', arr: 1500000, healthScore: 58, engagementScore: 50, signal: 'adoption_lag',       cases: 8,  csat: 6.8, renewalDays: 85 },
  { name: 'Kyoto Precision Mfg',       industry: 'Manufacturing',    region: 'APAC',          arr: 1400000, healthScore: 85, engagementScore: 81, signal: 'healthy',            cases: 2,  csat: 8.5, renewalDays: 300 },
  { name: 'Nordic Digital AB',         industry: 'Technology',       region: 'EMEA',          arr: 1350000, healthScore: 91, engagementScore: 93, signal: 'expansion',          cases: 0,  csat: 9.5, renewalDays: 270 },
  { name: 'Redwood University',        industry: 'Education',        region: 'North America', arr: 1200000, healthScore: 66, engagementScore: 62, signal: 'renewal_imminent',   cases: 5,  csat: 7.3, renewalDays: 21 },
  { name: 'Sahara Mining Corp',        industry: 'Energy',           region: 'EMEA',          arr: 1100000, healthScore: 40, engagementScore: 32, signal: 'churn_risk',         cases: 15, csat: 5.2, renewalDays: 38 },
  { name: 'Brightstar Education',      industry: 'Education',        region: 'APAC',          arr: 980000,  healthScore: 77, engagementScore: 74, signal: 'healthy',            cases: 3,  csat: 8.1, renewalDays: 160 },
  { name: 'Metro Gov Solutions',       industry: 'Government',       region: 'North America', arr: 920000,  healthScore: 52, engagementScore: 45, signal: 'adoption_lag',       cases: 10, csat: 6.2, renewalDays: 90 },
  { name: 'Velocity Sports Tech',      industry: 'Media',            region: 'North America', arr: 850000,  healthScore: 86, engagementScore: 89, signal: 'expansion',          cases: 1,  csat: 9.0, renewalDays: 340 },
  { name: 'Fjord Consulting',          industry: 'Financial Services',region: 'EMEA',          arr: 780000,  healthScore: 69, engagementScore: 64, signal: 'renewal_imminent',  cases: 4,  csat: 7.4, renewalDays: 30 },
  { name: 'Sunrise Hospitality',       industry: 'Retail',           region: 'APAC',          arr: 720000,  healthScore: 81, engagementScore: 76, signal: 'healthy',            cases: 2,  csat: 8.2, renewalDays: 210 },
  { name: 'Cedar Health Network',      industry: 'Healthcare',       region: 'North America', arr: 680000,  healthScore: 44, engagementScore: 35, signal: 'churn_risk',         cases: 12, csat: 5.4, renewalDays: 48 },
  { name: 'Quantum Dynamics Ltd',      industry: 'Technology',       region: 'EMEA',          arr: 620000,  healthScore: 75, engagementScore: 71, signal: 'healthy',            cases: 3,  csat: 7.8, renewalDays: 175 },
  { name: 'Lakeshore Manufacturing',   industry: 'Manufacturing',    region: 'North America', arr: 550000,  healthScore: 60, engagementScore: 53, signal: 'renewal_imminent',   cases: 6,  csat: 7.0, renewalDays: 12 },
];

function buildDemoData() {
  return DEMO_ACCOUNTS.map((acct, i) => {
    const trendDirection = acct.signal === 'expansion' ? 0.12
      : acct.signal === 'churn_risk' ? -0.10
      : acct.signal === 'adoption_lag' ? -0.03
      : 0.02;

    return {
      id: `acct-${String(i + 1).padStart(3, '0')}`,
      ...acct,
      monthlyData: monthlyTrend(acct.arr / 12, 0.08, trendDirection),
    };
  });
}

// ─── Cross-segment flow matrix (for Chord diagram) ──────────────────

function buildFlowMatrix(accounts) {
  const industries = [...new Set(accounts.map((a) => a.industry))];
  const size = industries.length;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));

  for (const acct of accounts) {
    const srcIdx = industries.indexOf(acct.industry);
    for (const other of accounts) {
      if (other.id === acct.id) continue;
      const tgtIdx = industries.indexOf(other.industry);
      if (acct.region === other.region) {
        matrix[srcIdx][tgtIdx] += Math.round(acct.arr * 0.001);
      }
    }
  }

  return { labels: industries, matrix };
}

// ─── Aggregate stats ────────────────────────────────────────────────

function computeStats(accounts) {
  const totalARR = accounts.reduce((s, a) => s + a.arr, 0);
  const atRiskARR = accounts
    .filter((a) => a.signal === 'churn_risk')
    .reduce((s, a) => s + a.arr, 0);
  const renewalsSoon = accounts.filter((a) => a.renewalDays <= 90).length;
  const avgHealth = Math.round(accounts.reduce((s, a) => s + a.healthScore, 0) / accounts.length);
  const avgCSAT = +(accounts.reduce((s, a) => s + a.csat, 0) / accounts.length).toFixed(1);

  return {
    totalARR,
    atRiskARR,
    renewalsSoon,
    avgHealth,
    avgCSAT,
    totalAccounts: 390,
    displayedAccounts: accounts.length,
  };
}

// ─── Public API ──────────────────────────────────────────────────────

let cachedData = null;

export async function fetchData(appId = null) {
  if (appId) {
    return fetchFromQlik(appId);
  }
  return getDemoData();
}

export function getDemoData() {
  if (cachedData) return cachedData;

  const accounts = buildDemoData();
  const flows = buildFlowMatrix(accounts);
  const stats = computeStats(accounts);

  cachedData = { accounts, flows, stats };
  return cachedData;
}

async function fetchFromQlik(appId) {
  // Placeholder for Qlik MCP integration.
  // In production this would call:
  //   1. qlik.apps.get(appId)
  //   2. Evaluate expressions / hypercube
  //   3. Transform into the same { accounts, flows, stats } shape
  console.warn(`[DataBridge] Qlik MCP not yet connected. AppID: ${appId}. Falling back to demo data.`);
  return getDemoData();
}

export function getDataShape(data) {
  if (!data?.accounts?.length) return null;

  const sample = data.accounts[0];
  return {
    fields: Object.keys(sample),
    rowCount: data.accounts.length,
    hasTimeSeries: Array.isArray(sample.monthlyData),
    hasFlowMatrix: !!data.flows?.matrix,
    numericFields: Object.keys(sample).filter((k) => typeof sample[k] === 'number'),
    categoricalFields: Object.keys(sample).filter((k) => typeof sample[k] === 'string'),
  };
}
