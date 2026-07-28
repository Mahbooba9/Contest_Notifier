import React, { useState, useEffect } from 'react';
import './index.css';

// MOCK_DATA removed as we now fetch real data from the backend

function App() {
  const [data, setData] = useState([]);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Add an abort controller to timeout the fetch if the API is down
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    // Fetch from our own backend API instead of Kontests directly
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    fetch(`${apiUrl}/api/contests`, { signal: controller.signal })
      .then(res => res.json())
      .then(json => {
         clearTimeout(timeoutId);
         // The backend already returns upcoming contests sorted, but we can double check
         const sorted = json.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
         setData(sorted.slice(0, 12)); 
         setLoading(false);
      })
      .catch(err => {
          clearTimeout(timeoutId);
          console.error("Failed to fetch contests from backend.", err);
          // Show error or empty state instead of fake data
          setLoading(false);
      });
  }, []);

  const sendEmail = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ text: '', type: '' });
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/sub`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const reply = await res.json();
      
      if (res.ok) {
          setMsg({ text: reply.msg, type: 'success' });
          setEmail('');
      } else {
          setMsg({ text: reply.err, type: 'error' });
      }
    } catch (err) {
        setMsg({ text: 'Failed to connect to server.', type: 'error' });
    }
    setSubmitting(false);
  };

  return (
    <div className="dashboard-container">
      <div className="header">
        <h1>DevCompete</h1>
        <p>Never miss a coding contest again. Get daily alerts straight to your inbox.</p>
      </div>
      
      <div className="subscribe-card">
        <h3>Subscribe for Daily Alerts</h3>
        <form onSubmit={sendEmail} className="form-group">
          <input 
            type="email" 
            placeholder="Enter your email address..." 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
          />
          <button type="submit" disabled={submitting}>
              {submitting ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
        {msg.text && (
            <div className={`message ${msg.type}`}>
                {msg.text}
            </div>
        )}
      </div>

      <div className="contests-section">
        <h2 style={{ marginBottom: '20px', fontSize: '1.8rem' }}>Upcoming Contests</h2>
        {loading ? (
            <div className="loader">Loading contests...</div>
        ) : (
            <div className="contests-grid">
              {data.map((c, i) => {
                  const startTime = new Date(c.start_time);
                  return (
                    <div key={i} className="contest-card">
                      <h3>{c.name}</h3>
                      <div className="contest-detail">
                        <strong>Platform:</strong> {c.site}
                      </div>
                      <div className="contest-detail">
                        <strong>Date:</strong> {startTime.toLocaleDateString()}
                      </div>
                      <div className="contest-detail">
                        <strong>Time:</strong> {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="register-btn">
                          <a href={c.url} target="_blank" rel="noreferrer">Register Now</a>
                      </div>
                    </div>
                  );
              })}
            </div>
        )}
      </div>
    </div>
  );
}

export default App;
