import { useState } from 'react';

export default function EntryScreen({ onStart, error }) {
  const [appId, setAppId] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onStart(appId.trim() || null);
  }

  return (
    <div className="entry-screen">
      {/* ── Left Column ── */}
      <div className="entry-screen__left">
        <div className="entry-screen__eyebrow">
          <span className="entry-dot" style={{ background: '#d94f28' }} />
          <span className="entry-dot" style={{ background: '#c98b1f' }} />
          <span className="entry-dot" style={{ background: '#35976b' }} />
          <span className="entry-screen__eyebrow-text">Qlik Story Engine</span>
        </div>

        <h1 className="entry-screen__headline">
          Every dataset<br />
          <em>has a story.</em><br />
          Let&#8217;s find yours.
        </h1>

        <p className="entry-screen__subtitle">
          Paste a Qlik App ID. Your customer signals transform into
          a cinematic scrollable narrative&nbsp;&mdash; powered by live
          Qlik data and D3.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="entry-screen__input-wrap">
            <input
              type="text"
              className="entry-screen__input"
              placeholder="e.g. e8412bfa-8d2e-4330-a9e3…"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              autoFocus
            />
            <button type="submit" className="entry-screen__btn">
              Generate Story &rarr;
            </button>
          </div>
        </form>

        <p className="entry-screen__demo-hint">
          or{' '}
          <button
            type="button"
            className="entry-screen__demo-btn"
            onClick={() => onStart(null)}
          >
            load demo &middot; Customer Signal Dashboard
          </button>
        </p>

        <div className="entry-screen__status">
          {error && <span className="entry-screen__error">{error}</span>}
        </div>
      </div>

      {/* ── Right Column ── */}
      <div className="entry-screen__right">
        <svg viewBox="0 0 500 500" className="entry-screen__orbit-svg">
          {/* Faint connection lines */}
          <line x1="250" y1="250" x2="345" y2="250" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <line x1="250" y1="250" x2="250" y2="120" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <line x1="250" y1="250" x2="155" y2="290" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <line x1="250" y1="250" x2="310" y2="170" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <line x1="250" y1="250" x2="130" y2="200" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <line x1="250" y1="250" x2="350" y2="310" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

          {/* Orbiting account nodes */}
          <circle className="orbit-node orbit-node--1" cx="250" cy="250" r="10" fill="#3282c8" />
          <circle className="orbit-node orbit-node--2" cx="250" cy="250" r="8"  fill="#35976b" />
          <circle className="orbit-node orbit-node--3" cx="250" cy="250" r="12" fill="#c98b1f" />
          <circle className="orbit-node orbit-node--4" cx="250" cy="250" r="7"  fill="#7c52e8" />
          <circle className="orbit-node orbit-node--5" cx="250" cy="250" r="9"  fill="#d94f28" />
          <circle className="orbit-node orbit-node--6" cx="250" cy="250" r="11" fill="#35976b" />

          {/* Floating account labels */}
          <text className="orbit-label orbit-label--1" x="250" y="250">Meridian</text>
          <text className="orbit-label orbit-label--2" x="250" y="250">Apex</text>
          <text className="orbit-label orbit-label--3" x="250" y="250">ClearView</text>
          <text className="orbit-label orbit-label--4" x="250" y="250">TerraVolt</text>

          {/* Center pulse node */}
          <circle cx="250" cy="250" r="32" fill="#d94f28" opacity="0.9" />
          <circle className="pulse-ring" cx="250" cy="250" r="32" fill="none" stroke="#d94f28" strokeWidth="1" />
          <text
            x="250" y="250"
            fill="white"
            fontSize="12"
            fontFamily="monospace"
            textAnchor="middle"
            dominantBaseline="central"
          >CSP</text>

          {/* Bottom watermark */}
          <text
            x="250" y="480"
            textAnchor="middle"
            fontFamily="monospace"
            fontSize="9"
            letterSpacing="0.2em"
            fill="rgba(255,255,255,0.12)"
          >POWERED BY QLIK MCP &middot; LIVE DATA</text>
        </svg>
      </div>
    </div>
  );
}
