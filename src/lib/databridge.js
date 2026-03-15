/**
 * Data Bridge — static JSON loader + Qlik MCP connector
 *
 * Default: loads /ravenstack_data.json (500 accounts).
 * With appId: calls Qlik MCP via qlik-mcp-client.js.
 */

// ─── Public API ──────────────────────────────────────────────────────

let cachedData = null;

export async function fetchData(appId = null) {
  if (appId && appId.trim().length > 0) {
    const { fetchFromQlikMCP } = await import('./qlik-mcp-client.js');
    return await fetchFromQlikMCP(appId.trim());
  }
  return loadStaticData();
}

async function loadStaticData() {
  if (cachedData) return cachedData;

  const res = await fetch('/ravenstack_data.json');
  if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
  const raw = await res.json();

  const accounts = raw.accounts.map((a) => ({
    ...a,
    region: a.geo || a.region || 'Unknown',
    monthlyData: generateMonthlyData(a),
  }));

  const flows = buildFlowMatrix(accounts);

  const stats = {
    ...raw.stats,
    avgCSAT: accounts.length
      ? +(accounts.reduce((s, d) => s + (d.csat || 0), 0) / accounts.length).toFixed(1)
      : 0,
    renewalsSoon: accounts.filter((d) => d.renewalDays > 0 && d.renewalDays <= 90).length,
  };

  cachedData = {
    appName: 'RavenStack Customer Intelligence',
    accounts,
    flows,
    stats,
  };
  return cachedData;
}

// ─── Monthly data generation (for radial scene) ─────────────────────

function generateMonthlyData(acct) {
  const base = (acct.arr || 0) / 12;
  const trend = acct.signal === 'expansion' ? 0.12
    : acct.signal === 'churn_risk' ? -0.10
    : acct.signal === 'adoption_lag' ? -0.03
    : 0.02;

  let val = base;
  return Array.from({ length: 12 }, (_, i) => {
    val = val * (1 + trend / 12) + (Math.random() - 0.5) * base * 0.08;
    return {
      month: `2025-${String(i + 1).padStart(2, '0')}`,
      arr: Math.round(val),
      health: Math.min(100, Math.max(0, Math.round((acct.healthScore || 50) + (Math.random() - 0.5) * 20))),
      engagement: Math.min(100, Math.max(0, Math.round((acct.engagementScore || 50) + (Math.random() - 0.5) * 25))),
      cases: Math.max(0, Math.round(Math.random() * (acct.cases || 2))),
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
        matrix[srcIdx][tgtIdx] += Math.round((acct.arr || 0) * 0.0005);
      }
    }
  }
  return { labels: industries, matrix };
}

// ─── Data shape introspection (for recommender) ─────────────────────

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
