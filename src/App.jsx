import { useState, useCallback, useEffect } from 'react';
import { fetchData } from './lib/databridge.js';
import EntryScreen from './components/EntryScreen.jsx';
import StoryView from './components/StoryView.jsx';

// Register all scene modules (side-effect imports)
import './scenes/SceneForce.jsx';
import './scenes/SceneBubble.jsx';
import './scenes/SceneRadial.jsx';
import './scenes/SceneTreemap.jsx';
import './scenes/SceneChord.jsx';

const LOADING_MESSAGES = [
  'Connecting to Qlik MCP...',
  'Reading app structure...',
  'Extracting account data...',
  'Building your story...',
];

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleStart = useCallback(async (appId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchData(appId);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  if (!data && !loading) {
    return <EntryScreen onStart={handleStart} error={error} />;
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-screen__spinner" />
        <p>{loadingMsg}</p>
      </div>
    );
  }

  return <StoryView data={data} />;
}
