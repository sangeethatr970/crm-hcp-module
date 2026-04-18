import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { addInteraction, updateInteraction } from '../store';

const API = 'http://127.0.0.1:8000';

const initialForm = {
  hcp_name: '',
  interaction_type: 'Meeting',
  date: '',
  time: '',
  attendees: '',
  topics_discussed: '',
  materials_shared: '',
  samples_distributed: '',
  sentiment: 'Neutral',
  outcomes: '',
  follow_up_actions: ''
};

const toStr = (val) => {
  if (!val) return "";
  if (Array.isArray(val)) return val.join(", ");
  return String(val);
};

function LogInteractionScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [form, setForm] = useState(initialForm);
  const [activeTab, setActiveTab] = useState('form');
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: 'Hi! I\'m your AI assistant. Describe your HCP interaction and I\'ll log it for you. Example: "Met Dr. Smith today, discussed Product X efficacy, positive sentiment, shared brochure."' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toTimeString().slice(0, 5);

    if (editId) {
      axios.get(`${API}/interactions/${editId}`).then(res => {
        setForm({
          hcp_name: res.data.hcp_name || '',
          interaction_type: res.data.interaction_type || 'Meeting',
          date: res.data.date || dateStr,
          time: res.data.time || timeStr,
          attendees: res.data.attendees || '',
          topics_discussed: res.data.topics_discussed || '',
          materials_shared: res.data.materials_shared || '',
          samples_distributed: res.data.samples_distributed || '',
          sentiment: res.data.sentiment || 'Neutral',
          outcomes: res.data.outcomes || '',
          follow_up_actions: res.data.follow_up_actions || '',
        });
      });
    } else {
      setForm(f => ({ ...f, date: dateStr, time: timeStr }));
    }
  }, [editId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const buildPayload = (f) => ({
    hcp_name: toStr(f.hcp_name) || "Unknown",
    interaction_type: toStr(f.interaction_type) || "Meeting",
    date: toStr(f.date) || new Date().toISOString().split('T')[0],
    time: toStr(f.time) || new Date().toTimeString().slice(0, 5),
    attendees: toStr(f.attendees),
    topics_discussed: toStr(f.topics_discussed),
    materials_shared: toStr(f.materials_shared),
    samples_distributed: toStr(f.samples_distributed),
    sentiment: ["Positive", "Neutral", "Negative"].includes(f.sentiment) ? f.sentiment : "Neutral",
    outcomes: toStr(f.outcomes),
    follow_up_actions: toStr(f.follow_up_actions),
    chat_text: ""
  });

  const handleFormSubmit = async () => {
    if (!form.hcp_name) {
      alert('Please fill in HCP Name.');
      return;
    }
    setLoading(true);
    try {
      const payload = buildPayload(form);
      if (editId) {
        const res = await axios.put(`${API}/interactions/${editId}`, payload);
        dispatch(updateInteraction(res.data));
        alert('Interaction updated successfully!');
      } else {
        const res = await axios.post(`${API}/interactions/`, payload);
        dispatch(addInteraction(res.data));
        alert('Interaction logged successfully!');
      }
      navigate('/');
    } catch (e) {
      console.error("Error:", e.response?.data);
      alert('Error saving. Check console for details.');
    }
    setLoading(false);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);
    try {
      const res = await axios.post(`${API}/agent/chat`, {
        message: userMsg,
        tool_name: 'log_interaction'
      });
      const aiResponse = res.data.response;
      setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);

      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]);
          const today = new Date();
          setForm({
            hcp_name: toStr(extracted.hcp_name),
            interaction_type: toStr(extracted.interaction_type) || "Meeting",
            date: today.toISOString().split('T')[0],
            time: today.toTimeString().slice(0, 5),
            attendees: toStr(extracted.attendees),
            topics_discussed: toStr(extracted.topics_discussed),
            materials_shared: toStr(extracted.materials_shared),
            samples_distributed: toStr(extracted.samples_distributed),
            sentiment: ["Positive","Neutral","Negative"].includes(extracted.sentiment) ? extracted.sentiment : "Neutral",
            outcomes: toStr(extracted.outcomes),
            follow_up_actions: toStr(extracted.follow_up_actions),
          });
          setChatMessages(prev => [...prev, {
            role: 'ai',
            text: '✅ Details extracted and form filled! Switch to Form tab to review and submit.'
          }]);
        }
      } catch (parseErr) {
        console.log("JSON parse error:", parseErr);
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Sorry, encountered an error. Please try again.' }]);
    }
    setChatLoading(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.3)',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    background: 'rgba(255,255,255,0.9)',
    color: '#333',
    transition: 'all 0.2s ease',
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '600',
    color: '#444',
    marginBottom: '6px',
    display: 'block'
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 24px', display: 'flex', gap: '24px' }}>

      {/* Left Panel - Main Form */}
      <div className="glass-white card-hover" style={{
        flex: 1, borderRadius: '16px', padding: '28px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a2e' }}>
            {editId ? '✏️ Edit HCP Interaction' : '📋 Log HCP Interaction'}
          </h2>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
            Use the form or let AI extract details from your notes
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#f0f4ff', padding: '4px', borderRadius: '10px' }}>
          {['form', 'chat'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: '600', fontSize: '13px',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.2s ease',
              background: activeTab === tab ? 'white' : 'transparent',
              color: activeTab === tab ? '#6366f1' : '#888',
              boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            }}>
              {tab === 'form' ? '📝 Form Input' : '🤖 AI Chat'}
            </button>
          ))}
        </div>

        {activeTab === 'form' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>HCP Name *</label>
                <input name="hcp_name" value={form.hcp_name} onChange={handleChange}
                  placeholder="Search or enter HCP name..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Interaction Type</label>
                <select name="interaction_type" value={form.interaction_type} onChange={handleChange} style={inputStyle}>
                  {['Meeting', 'Call', 'Email', 'Conference', 'Visit'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Date *</label>
                <input type="date" name="date" value={form.date} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Time</label>
                <input type="time" name="time" value={form.time} onChange={handleChange} style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Attendees</label>
              <input name="attendees" value={form.attendees} onChange={handleChange}
                placeholder="Enter names or search..." style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Topics Discussed</label>
              <textarea name="topics_discussed" value={form.topics_discussed} onChange={handleChange}
                placeholder="Enter key discussion points..." rows={3}
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Materials Shared</label>
                <input name="materials_shared" value={form.materials_shared} onChange={handleChange}
                  placeholder="Brochures, PDFs..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Samples Distributed</label>
                <input name="samples_distributed" value={form.samples_distributed} onChange={handleChange}
                  placeholder="Product samples..." style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>HCP Sentiment</label>
              <div style={{ display: 'flex', gap: '16px' }}>
                {['Positive', 'Neutral', 'Negative'].map(s => (
                  <label key={s} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    cursor: 'pointer', fontSize: '14px', fontWeight: '500',
                    padding: '8px 16px', borderRadius: '8px', transition: 'all 0.2s',
                    background: form.sentiment === s ? (s === 'Positive' ? '#e6f4ea' : s === 'Negative' ? '#fce8e6' : '#e8f0fe') : '#f5f5f5',
                    border: form.sentiment === s ? `2px solid ${s === 'Positive' ? '#34a853' : s === 'Negative' ? '#ea4335' : '#1a73e8'}` : '2px solid transparent',
                  }}>
                    <input type="radio" name="sentiment" value={s}
                      checked={form.sentiment === s} onChange={handleChange}
                      style={{ display: 'none' }} />
                    {s === 'Positive' ? '😊' : s === 'Negative' ? '😞' : '😐'} {s}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Outcomes</label>
              <textarea name="outcomes" value={form.outcomes} onChange={handleChange}
                placeholder="Key outcomes or agreements..." rows={2}
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div>
              <label style={labelStyle}>Follow-up Actions</label>
              <textarea name="follow_up_actions" value={form.follow_up_actions} onChange={handleChange}
                placeholder="Enter next steps or tasks..." rows={2}
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <button onClick={handleFormSubmit} disabled={loading}
              className="btn-hover"
              style={{
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white', border: 'none',
                padding: '14px 24px', borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '700', fontSize: '15px',
                fontFamily: 'Inter, sans-serif', marginTop: '8px',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(102,126,234,0.4)',
              }}>
              {loading ? '⏳ Saving...' : editId ? '✅ Update Interaction' : '✅ Log Interaction'}
            </button>
          </div>
        ) : (
          /* Chat Tab */
          <div style={{ display: 'flex', flexDirection: 'column', height: '520px' }}>
            <div style={{
              flex: 1, overflowY: 'auto', padding: '8px',
              display: 'flex', flexDirection: 'column', gap: '12px',
              background: '#f8f9ff', borderRadius: '10px', marginBottom: '12px', padding: '16px'
            }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%', padding: '12px 16px', borderRadius: '16px',
                    fontSize: '13px', lineHeight: '1.6',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'white',
                    color: msg.role === 'user' ? 'white' : '#333',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                    borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '16px',
                  }}>
                    {msg.role === 'ai' && (
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', display: 'block', marginBottom: '4px' }}>
                        🤖 AI Assistant
                      </span>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ background: 'white', padding: '12px 16px', borderRadius: '16px', fontSize: '13px', color: '#666', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    🤖 Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChatSend()}
                placeholder="Describe interaction... e.g. Met Dr. Smith, discussed Product X..."
                style={{ ...inputStyle, flex: 1 }} />
              <button onClick={handleChatSend} disabled={chatLoading}
                className="btn-hover"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white', border: 'none', padding: '10px 20px',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
                  fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
                  boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
                }}>
                🚀 Log
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* AI Assistant Card */}
        <div className="glass-white card-hover" style={{
          borderRadius: '16px', padding: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
            }}>🤖</div>
            <div>
              <p style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a2e' }}>AI Assistant</p>
              <p style={{ fontSize: '11px', color: '#888' }}>Groq + LangGraph</p>
            </div>
          </div>

          <div style={{ background: '#f0f4ff', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: '#555', lineHeight: '1.7' }}>
              Switch to <strong>AI Chat</strong> tab to describe your interaction in natural language. AI will extract and fill the form automatically!
            </p>
          </div>

          <p style={{ fontSize: '12px', fontWeight: '700', color: '#444', marginBottom: '10px' }}>🛠️ LangGraph Tools:</p>
          {[
            { icon: '📥', name: 'Log Interaction', desc: 'Captures & summarizes HCP data using LLM' },
            { icon: '✏️', name: 'Edit Interaction', desc: 'Modifies logged records intelligently' },
            { icon: '💡', name: 'Get Suggestions', desc: 'AI follow-up recommendations' },
            { icon: '📊', name: 'Analyze Sentiment', desc: 'HCP engagement analysis' },
            { icon: '📝', name: 'Summarize', desc: 'Professional CRM summary generation' },
          ].map(tool => (
            <div key={tool.name} style={{
              marginBottom: '8px', padding: '10px', borderRadius: '8px',
              background: '#fafafa', border: '1px solid #f0f0f0',
              transition: 'all 0.2s ease',
            }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#6366f1' }}>{tool.icon} {tool.name}</p>
              <p style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{tool.desc}</p>
            </div>
          ))}
        </div>

        {/* Tips Card */}
        <div className="glass-white" style={{ borderRadius: '16px', padding: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a2e', marginBottom: '10px' }}>💡 Pro Tips</p>
          {[
            'Use AI Chat for faster logging',
            'Mention doctor name clearly',
            'Include product names discussed',
            'Note sentiment for better insights',
          ].map((tip, i) => (
            <p key={i} style={{ fontSize: '12px', color: '#666', marginBottom: '6px', paddingLeft: '8px', borderLeft: '2px solid #6366f1' }}>
              {tip}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LogInteractionScreen;