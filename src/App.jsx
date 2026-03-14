import { useState, useCallback } from 'react';
import { fetchData } from './lib/databridge.js';
import EntryScreen from './components/EntryScreen.jsx';
import StoryView from './components/StoryView.jsx';

// Register all scene modules (side-effect imports)
import './scenes/SceneForce.jsx';
import './scenes/SceneBubble.jsx';
import './scenes/SceneRadial.jsx';
import './scenes/SceneTreemap.jsx';
import './scenes/SceneChord.jsx';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        <p>Building your story...</p>
      </div>
    );
  }

  return <StoryView data={data} />;
}
