import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setInteractions, setLoading, removeInteraction } from '../store';

const API = 'http://127.0.0.1:8000';

function InteractionList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading } = useSelector(s => s.interactions);
  const [agentResults, setAgentResults] = useState({});

  useEffect(() => {
    fetchInteractions();
  }, []);

  const fetchInteractions = async () => {
    dispatch(setLoading(true));
    try {
      const res = await axios.get(`${API}/interactions/`);
      dispatch(setInteractions(res.data));
    } catch (e) {
      console.error(e);
    }
    dispatch(setLoading(false));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this interaction?')) {
      await axios.delete(`${API}/interactions/${id}`);
      dispatch(removeInteraction(id));
    }
  };

  const handleAgentAction = async (id, action) => {
    try {
      const res = await axios.post(`${API}/agent/${action}/${id}`);
      const key = Object.keys(res.data)[0];
      setAgentResults(prev => ({ ...prev, [`${id}_${action}`]: res.data[key] }));
    } catch (e) {
      console.error(e);
    }
  };

  const sentimentColor = (s) => {
    if (s === 'Positive') return '#e6f4ea';
    if (s === 'Negative') return '#fce8e6';
    return '#f0f4ff';
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', fontSize: '18px', color: '#666' }}>
      Loading interactions...
    </div>
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a2e' }}>HCP Interactions</h2>
        <button onClick={() => navigate('/log')} style={{
          background: '#1a73e8', color: 'white', border: 'none',
          padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
          fontWeight: '600', fontSize: '14px', fontFamily: 'Inter, sans-serif'
        }}>+ Log New Interaction</button>
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '12px', color: '#666' }}>
          <p style={{ fontSize: '18px' }}>No interactions yet.</p>
          <p>Click "Log New Interaction" to get started!</p>
        </div>
      ) : (
        list.map(item => (
          <div key={item.id} style={{
            background: 'white', borderRadius: '12px', padding: '24px',
            marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderLeft: `4px solid ${item.sentiment === 'Positive' ? '#34a853' : item.sentiment === 'Negative' ? '#ea4335' : '#1a73e8'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a2e' }}>{item.hcp_name}</h3>
                <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                  {item.interaction_type} • {item.date} at {item.time}
                </p>
              </div>
              <span style={{
                background: sentimentColor(item.sentiment),
                padding: '4px 12px', borderRadius: '20px',
                fontSize: '12px', fontWeight: '600', color: '#333'
              }}>{item.sentiment}</span>
            </div>

            {item.topics_discussed && (
              <p style={{ marginTop: '12px', color: '#444', fontSize: '14px' }}>
                <strong>Topics:</strong> {item.topics_discussed}
              </p>
            )}
            {item.outcomes && (
              <p style={{ marginTop: '6px', color: '#444', fontSize: '14px' }}>
                <strong>Outcomes:</strong> {item.outcomes}
              </p>
            )}
            {item.ai_summary && (
              <div style={{ marginTop: '12px', background: '#f8f9ff', padding: '12px', borderRadius: '8px' }}>
                <p style={{ fontSize: '13px', color: '#555' }}>
                  <strong>🤖 AI Summary:</strong> {item.ai_summary.substring(0, 200)}...
                </p>
              </div>
            )}

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => handleAgentAction(item.id, 'suggest')} style={btnStyle('#e8f5e9', '#2e7d32')}>
                💡 Get Suggestions
              </button>
              <button onClick={() => handleAgentAction(item.id, 'sentiment')} style={btnStyle('#e3f2fd', '#1565c0')}>
                📊 Analyze Sentiment
              </button>
              <button onClick={() => handleAgentAction(item.id, 'summarize')} style={btnStyle('#fff3e0', '#e65100')}>
                📝 Summarize
              </button>
              <button onClick={() => navigate(`/log?edit=${item.id}`)} style={btnStyle('#f3e5f5', '#6a1b9a')}>
                ✏️ Edit
              </button>
              <button onClick={() => handleDelete(item.id)} style={btnStyle('#fce8e6', '#c62828')}>
                🗑️ Delete
              </button>
            </div>

            {Object.keys(agentResults).filter(k => k.startsWith(`${item.id}_`)).map(k => (
              <div key={k} style={{ marginTop: '12px', background: '#f0f7ff', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#333' }}>
                <strong>🤖 AI Result:</strong>
                <p style={{ marginTop: '6px', whiteSpace: 'pre-wrap' }}>{agentResults[k]}</p>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

const btnStyle = (bg, color) => ({
  background: bg, color: color, border: 'none',
  padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
  fontSize: '12px', fontWeight: '600', fontFamily: 'Inter, sans-serif'
});

export default InteractionList;
