import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();

  return (
    <nav style={{
      background: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.2)',
      padding: '0 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '70px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #fff 0%, #e0e7ff 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>🏥</div>
        <div>
          <p style={{ color: 'white', fontWeight: '800', fontSize: '18px', letterSpacing: '0.3px' }}>CRM HCP Module</p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>AI-Powered Life Sciences CRM</p>
        </div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {[
          { path: '/', label: '📋 Interactions' },
          { path: '/log', label: '+ Log Interaction' },
        ].map(({ path, label }) => (
          <Link key={path} to={path} style={{
            textDecoration: 'none',
            padding: '8px 20px',
            borderRadius: '25px',
            fontWeight: '600',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.2s ease',
            background: location.pathname === path ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.15)',
            color: location.pathname === path ? '#6366f1' : 'white',
            border: '1px solid rgba(255,255,255,0.3)',
          }}>{label}</Link>
        ))}

        <div style={{
          marginLeft: '12px', width: '38px', height: '38px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #f093fb, #f5576c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: '700', fontSize: '14px',
          boxShadow: '0 4px 15px rgba(240,147,251,0.4)',
          cursor: 'pointer'
        }}>S</div>
      </div>
    </nav>
  );
}

export default Navbar;