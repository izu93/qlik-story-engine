/**
 * Qlik MCP Client — calls Anthropic API with Qlik MCP tools
 *
 * Claude reads the live Qlik app via MCP tool calls and returns
 * structured JSON matching the Story Engine data schema.
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    'anthropic-beta': 'mcp-client-2025-04-04',
  },
});

const QLIK_MCP_URL = import.meta.env.VITE_QLIK_MCP_URL;

const SYSTEM_PROMPT = `You are a data extraction agent for the Qlik Story Engine. When given a Qlik App ID, you MUST:

1. Call qlik_describe_app to get app metadata
2. Call qlik_list_sheets to find all sheets
3. Call qlik_get_fields to get available fields
4. Call qlik_get_chart_data on key objects to extract data

Then return ONLY a valid JSON object (no markdown, no explanation) matching this exact schema:

{
  "appName": "string",
  "accounts": [
    {
      "id": "string",
      "name": "string",
      "industry": "string",
      "region": "string",
      "arr": number,
      "healthScore": number (0-100),
      "engagementScore": number (0-100),
      "signal": "churn_risk|expansion|healthy|adoption_lag|renewal_imminent",
      "cases": number,
      "csat": number,
      "renewalDays": number,
      "monthlyData": [
        { "month": "YYYY-MM", "arr": number, "health": number, "engagement": number, "cases": number }
      ]
    }
  ],
  "stats": {
    "totalARR": number,
    "atRiskARR": number,
    "renewalsSoon": number,
    "avgHealth": number,
    "avgCSAT": number,
    "totalAccounts": number,
    "displayedAccounts": number
  }
}

If a field doesn't exist in the app, make a reasonable inference from available data or use 0 as default.
CRITICAL: Return ONLY the JSON. No text before or after.`;

export async function fetchFromQlikMCP(appId) {
  if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
    throw new Error('VITE_ANTHROPIC_API_KEY not set. Add it to your .env file.');
  }
  if (!QLIK_MCP_URL) {
    throw new Error('VITE_QLIK_MCP_URL not set. Add it to your .env file.');
  }

  const response = await client.beta.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Extract all customer account data from Qlik App ID: ${appId}\n\nUse qlik_describe_app, qlik_list_sheets, qlik_get_fields, and qlik_get_chart_data to read the app. Return the complete JSON schema.`,
      },
    ],
    mcp_servers: [
      {
        type: 'url',
        url: QLIK_MCP_URL,
        name: 'qlik',
      },
    ],
    betas: ['mcp-client-2025-04-04'],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text response from Claude');

  let raw;
  try {
    raw = JSON.parse(textBlock.text);
  } catch {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Claude response was not valid JSON');
    raw = JSON.parse(jsonMatch[0]);
  }

  if (!raw.accounts || !Array.isArray(raw.accounts)) {
    throw new Error('Response missing accounts array');
  }

  const flows = buildFlowMatrix(raw.accounts);

  return {
    appName: raw.appName || 'Qlik App',
    accounts: raw.accounts,
    flows,
    stats: raw.stats || computeStats(raw.accounts),
  };
}

function buildFlowMatrix(accounts) {
  if (!accounts?.length) return { labels: [], matrix: [] };

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

function computeStats(accounts) {
  const totalARR = accounts.reduce((s, a) => s + (a.arr || 0), 0);
  const atRiskARR = accounts
    .filter((a) => a.signal === 'churn_risk')
    .reduce((s, a) => s + (a.arr || 0), 0);
  const renewalsSoon = accounts.filter((a) => (a.renewalDays || 999) <= 90).length;
  const avgHealth = accounts.length
    ? Math.round(accounts.reduce((s, a) => s + (a.healthScore || 0), 0) / accounts.length)
    : 0;
  const avgCSAT = accounts.length
    ? +(accounts.reduce((s, a) => s + (a.csat || 0), 0) / accounts.length).toFixed(1)
    : 0;

  return {
    totalARR,
    atRiskARR,
    renewalsSoon,
    avgHealth,
    avgCSAT,
    totalAccounts: accounts.length,
    displayedAccounts: accounts.length,
  };
}
