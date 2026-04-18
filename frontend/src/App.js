import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const Navbar = React.lazy(() => import('./components/Navbar'));
const InteractionList = React.lazy(() => import('./components/InteractionList'));
const LogInteractionScreen = React.lazy(() => import('./components/LogInteractionScreen'));

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
    }}>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.15) !important; }
        .btn-hover { transition: all 0.2s ease; }
        .btn-hover:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .fade-in { animation: fadeInUp 0.5s ease forwards; }
        .float { animation: float 3s ease-in-out infinite; }
      `}</style>

      {/* Decorative blobs */}
      <div style={{
        position: 'fixed', top: '-100px', right: '-100px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)', pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'fixed', bottom: '-150px', left: '-100px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)', pointerEvents: 'none', zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Router>
          <React.Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
              <div style={{ color: 'white', fontSize: '18px', fontFamily: 'Inter, sans-serif' }}>Loading...</div>
            </div>
          }>
            <Navbar />
            <Routes>
              <Route path="/" element={<InteractionList />} />
              <Route path="/log" element={<LogInteractionScreen />} />
            </Routes>
          </React.Suspense>
        </Router>
      </div>
    </div>
  );
}

export default App;