import { useState } from 'react';

const PRESETS = [
  { label: 'Churn risk', query: 'Show me accounts at churn risk' },
  { label: 'ARR by industry', query: 'ARR distribution by industry' },
  { label: 'Health scatter', query: 'Health vs engagement for all accounts' },
  { label: 'Expansion', query: 'Show expansion opportunities' },
  { label: 'Renewals', query: 'Upcoming renewals at risk' },
  { label: 'Segment flows', query: 'Cross-segment industry flows' },
  { label: 'Full portfolio', query: 'Show the full account universe' },
  { label: 'Signal radar', query: 'Monthly signal radar over time' },
];

export default function QueryBar({ onQuery, loading }) {
  const [input, setInput] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (input.trim() && !loading) {
      onQuery(input.trim());
    }
  }

  return (
    <div className="query-bar">
      <form className="query-bar__row" onSubmit={handleSubmit}>
        <input
          type="text"
          className="query-bar__input"
          placeholder="Ask anything about your accounts..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="query-bar__btn"
          disabled={loading || !input.trim()}
        >
          {loading ? 'Thinking...' : 'Analyze \u2192'}
        </button>
      </form>
      <div className="query-bar__presets">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="query-bar__preset"
            onClick={() => { setInput(p.query); onQuery(p.query); }}
            disabled={loading}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
