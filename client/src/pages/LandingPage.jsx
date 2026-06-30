import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard');
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, [user, navigate]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * { box-sizing: border-box; }
        html, body { 
          margin: 0; padding: 0; 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #37352f;
          background: #ffffff;
          overflow-x: hidden !important;
          overflow-y: auto !important;
        }
        #root {
          height: auto !important;
          overflow-y: auto !important;
        }

        /* Nav */
        .notion-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          background: #ffffff;
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid rgba(55,53,47,0.08);
        }
        .nav-links { display: flex; align-items: center; gap: 24px; }
        .nav-link { 
          font-size: 14px; font-weight: 500; color: #37352f; 
          text-decoration: none; cursor: pointer;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #2383e2; }
        .nav-btn-outline {
          font-size: 14px; font-weight: 500; color: #37352f;
          background: transparent; border: 1px solid transparent;
          padding: 6px 12px; border-radius: 6px; cursor: pointer;
          transition: background 0.2s;
        }
        .nav-btn-outline:hover { background: rgba(55,53,47,0.05); }
        .nav-btn-primary {
          font-size: 14px; font-weight: 500; color: white;
          background: #2383e2; border: none;
          padding: 6px 14px; border-radius: 6px; cursor: pointer;
          transition: background 0.2s;
        }
        .nav-btn-primary:hover { background: #0b6fce; }

        /* Hero */
        .hero {
          text-align: center;
          padding: 80px 24px 60px;
          max-width: 900px;
          margin: 0 auto;
          position: relative;
        }

        /* Avatar row */
        .avatar-row {
          display: flex; justify-content: center; align-items: center; margin-bottom: 24px;
        }
        .avatar-circle {
          width: 52px; height: 52px; border-radius: 50%;
          border: 2px solid #37352f; background: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; margin-left: -10px; position: relative;
        }
        .avatar-circle:first-child { margin-left: 0; border-color: #2383e2; }
        .avatar-circle:nth-child(2) { border-color: #37352f; }
        .avatar-circle:nth-child(3) { border-color: #ea4335; background: #fce8e6; }
        .avatar-circle:nth-child(4) { border-color: #fbbc05; background: #fef7e0; }
        .avatar-circle:nth-child(5) { border-color: #34a853; background: #e6f4ea; }
        .avatar-circle:nth-child(6) { border-color: #ea4335; }

        .hero h1 {
          font-size: 64px; font-weight: 800; letter-spacing: -2.5px;
          line-height: 1.1; margin: 0 0 16px;
        }
        
        .pill {
          display: inline-block;
          background: #d1f4e0;
          color: #37352f;
          padding: 4px 20px;
          border-radius: 40px;
          position: relative;
        }
        .pill::before {
          content: '●'; color: #219653; position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 14px;
        }
        .pill { padding-left: 32px; }

        .hero p {
          font-size: 20px; color: #37352f; opacity: 0.9;
          font-weight: 500; margin: 0 auto 32px; max-width: 600px;
          line-height: 1.5;
        }

        .hero-btns {
          display: flex; justify-content: center; gap: 12px;
        }
        .hero-btn-primary {
          padding: 12px 24px; font-size: 16px; font-weight: 600;
          background: #2383e2; color: white; border: none; border-radius: 8px;
          cursor: pointer; transition: background 0.2s;
        }
        .hero-btn-primary:hover { background: #0b6fce; }
        .hero-btn-outline {
          padding: 12px 24px; font-size: 16px; font-weight: 600;
          background: white; color: #2383e2; border: 1px solid #2383e2; border-radius: 8px;
          cursor: pointer; transition: background 0.2s;
        }
        .hero-btn-outline:hover { background: rgba(35,131,226,0.05); }

        /* Dashboard Mockup */
        .dashboard-container {
          position: relative;
          max-width: 1000px;
          margin: 0 auto 80px;
          padding: 0 24px;
        }
        .mac-window {
          background: white;
          border-radius: 12px;
          border: 1px solid rgba(55,53,47,0.08);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05);
          overflow: hidden;
        }
        .mac-header {
          display: flex; align-items: center; padding: 12px 16px;
          border-bottom: 1px solid rgba(55,53,47,0.08); background: #fbfbfc;
        }
        .mac-dots { display: flex; gap: 8px; }
        .mac-dot { width: 12px; height: 12px; border-radius: 50%; }
        .dot-red { background: #ff5f56; }
        .dot-yellow { background: #ffbd2e; }
        .dot-green { background: #27c93f; }
        
        .mock-dashboard {
          display: flex; height: 500px;
        }
        .mock-sidebar {
          width: 220px; border-right: 1px solid rgba(55,53,47,0.08);
          background: #fbfbfc; padding: 16px;
        }
        .mock-nav-item {
          font-size: 13px; color: rgba(55,53,47,0.7); font-weight: 500;
          padding: 6px 8px; margin-bottom: 4px; display: flex; gap: 8px; align-items: center;
        }
        .mock-nav-item.active { background: rgba(55,53,47,0.05); border-radius: 6px; color: #37352f; }
        
        .mock-main {
          flex: 1; padding: 32px; background: white; overflow: hidden;
        }
        .kanban-board { display: flex; gap: 20px; }
        .kanban-col { flex: 1; }
        .k-header { font-size: 12px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }
        .k-dot { width: 14px; height: 14px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white;}
        .k-dot.todo { background: #7c3aed; }
        .k-dot.prog { background: #f59e0b; }
        .k-dot.done { background: #10b981; }
        
        .k-card {
          background: white; border: 1px solid rgba(55,53,47,0.1);
          border-radius: 6px; padding: 12px; margin-bottom: 10px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
          font-size: 13px; font-weight: 500;
        }

        /* Sparkles / Agents */
        .spark {
          position: absolute; width: 40px; height: 40px;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          animation: float 4s ease-in-out infinite;
          z-index: 10;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        /* Partners */
        .partners {
          display: flex; justify-content: center; gap: 40px; align-items: center;
          padding: 40px 24px; opacity: 0.6; flex-wrap: wrap; margin-bottom: 60px;
        }
        .partner-logo { font-size: 20px; font-weight: 700; color: #37352f; letter-spacing: -0.5px; }

        /* Features / "Keep work moving 24/7" */
        .features-section {
          max-width: 1000px; margin: 0 auto; padding: 0 24px 100px;
        }
        .features-header {
          font-size: 42px; font-weight: 800; letter-spacing: -1.5px; margin-bottom: 40px;
        }
        
        .features-grid {
          display: flex; gap: 32px;
        }
        
        .f-sidebar {
          width: 300px; display: flex; flex-direction: column; gap: 8px;
        }
        
        .f-tab {
          padding: 16px; border-radius: 12px; cursor: pointer;
          display: flex; flex-direction: column; gap: 4px;
        }
        .f-tab.active { background: #fbfbfc; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
        .f-tab-title { font-size: 16px; font-weight: 600; display: flex; alignItems: center; gap: 12px; }
        .f-icon { width: 28px; height: 28px; background: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        
        .f-content {
          flex: 1; background: #eef6f3; border-radius: 16px; padding: 40px;
          position: relative;
        }
        .f-content-card {
          background: white; border-radius: 12px; padding: 32px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }

        @media (max-width: 768px) {
          .nav-links { display: none; }
          .hero h1 { font-size: 42px; }
          .mock-sidebar { display: none; }
          .features-grid { flex-direction: column; }
          .f-sidebar { width: 100%; }
        }
      `}</style>

      {/* NAV */}
      <nav className="notion-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '4px',
            background: 'linear-gradient(135deg, #37352f, #1a1a1a)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '700', fontSize: '13px'
          }}>F</div>
          <span style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '-0.3px' }}>FlowPilot</span>
        </div>
        
        <div className="nav-links">
          <span className="nav-link">Product</span>
          <span className="nav-link">Solutions</span>
          <span className="nav-link">Resources</span>
          <span className="nav-link">Developers</span>
          <span className="nav-link">Pricing</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="nav-btn-outline" onClick={() => navigate('/login')}>Log in</button>
          <button className="nav-btn-primary" onClick={() => navigate('/login')}>Get FlowPilot free</button>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="avatar-row">
          <div className="avatar-circle">👩‍💼</div>
          <div className="avatar-circle">👨‍💻</div>
          <div className="avatar-circle">🤖</div>
          <div className="avatar-circle">🧑‍🎨</div>
          <div className="avatar-circle">⚡</div>
          <div className="avatar-circle">🕵️</div>
        </div>
        
        <h1>
          Where teams and<br />
          agents <span className="pill">Flow</span> together.
        </h1>
        
        <p>
          Capture context, plan sprints, and automate tasks with an autonomous AI built for your workflow.
        </p>
        
        <div className="hero-btns">
          <button className="hero-btn-primary" onClick={() => navigate('/login')}>Get FlowPilot free</button>
          <button className="hero-btn-outline" onClick={() => navigate('/login')}>Request a demo</button>
        </div>
      </div>

      {/* MOCK DASHBOARD */}
      <div className="dashboard-container">
        {/* Floating Sparks */}
        <div className="spark" style={{ top: '10%', left: '-20px', background: '#fef7e0', border: '1px solid #fbbc05' }}>💬</div>
        <div className="spark" style={{ bottom: '20%', right: '-30px', background: '#e6f4ea', border: '1px solid #34a853', animationDelay: '1s' }}>✅</div>
        <div className="spark" style={{ top: '40%', right: '-10px', background: '#fce8e6', border: '1px solid #ea4335', animationDelay: '2s' }}>🚨</div>

        <div className="mac-window">
          <div className="mac-header">
            <div className="mac-dots">
              <div className="mac-dot dot-red"></div>
              <div className="mac-dot dot-yellow"></div>
              <div className="mac-dot dot-green"></div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'rgba(55,53,47,0.5)' }}>FlowPilot HQ</div>
          </div>
          <div className="mock-dashboard">
            <div className="mock-sidebar">
              <div style={{ fontWeight: 600, marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🦅</span> FlowPilot HQ
              </div>
              <div className="mock-nav-item"><span style={{width:'16px'}}>🏠</span> Home</div>
              <div className="mock-nav-item active"><span style={{width:'16px'}}>📋</span> My tasks</div>
              <div className="mock-nav-item"><span style={{width:'16px'}}>🎯</span> Goals</div>
              <div className="mock-nav-item"><span style={{width:'16px'}}>🤖</span> AI Coach</div>
              
              <div style={{ marginTop: '24px', fontSize: '11px', fontWeight: 600, color: 'rgba(55,53,47,0.4)', textTransform: 'uppercase', marginBottom: '8px' }}>Agents</div>
              <div className="mock-nav-item"><span style={{width:'16px'}}>💬</span> Q&A Agent</div>
              <div className="mock-nav-item"><span style={{width:'16px'}}>📊</span> Reporting Agent</div>
              <div className="mock-nav-item"><span style={{width:'16px'}}>⚡</span> Rescue Agent</div>
            </div>
            <div className="mock-main">
              <h2 style={{ margin: '0 0 24px', fontSize: '28px', fontWeight: 700 }}>Current Sprint</h2>
              
              <div className="kanban-board">
                <div className="kanban-col">
                  <div className="k-header"><div className="k-dot todo">3</div> To-do</div>
                  <div className="k-card">Update help center docs</div>
                  <div className="k-card">Review campaign assets</div>
                  <div className="k-card">Customer stories</div>
                </div>
                
                <div className="kanban-col">
                  <div className="k-header"><div className="k-dot prog">2</div> In progress</div>
                  <div className="k-card" style={{ borderLeft: '3px solid #f59e0b' }}>Sales demo sync</div>
                  <div className="k-card" style={{ borderLeft: '3px solid #f59e0b' }}>Launch demo video</div>
                </div>
                
                <div className="kanban-col">
                  <div className="k-header"><div className="k-dot done">5</div> Complete</div>
                  <div className="k-card" style={{ opacity: 0.6, textDecoration: 'line-through' }}>Project onboarding</div>
                  <div className="k-card" style={{ opacity: 0.6, textDecoration: 'line-through' }}>All hands alignment</div>
                  <div className="k-card" style={{ opacity: 0.6, textDecoration: 'line-through' }}>Draft press release</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PARTNERS (FAKE LOGOS) */}
      <div className="partners">
        <div className="partner-logo">OpenAI</div>
        <div className="partner-logo">Figma</div>
        <div className="partner-logo">Cursor</div>
        <div className="partner-logo">▲ Vercel</div>
        <div className="partner-logo">NVIDIA</div>
        <div className="partner-logo">Discord</div>
      </div>

      {/* FEATURES */}
      <div className="features-section">
        <h2 className="features-header">Keep work moving 24/7.</h2>
        
        <div className="features-grid">
          <div className="f-sidebar">
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(55,53,47,0.5)', marginBottom: '8px' }}>Custom Agents</div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', lineHeight: 1.2 }}>Automate repetitive work for your team.</div>
            
            <div className="f-tab active">
              <div className="f-tab-title"><div className="f-icon">💬</div> Q&A agents</div>
            </div>
            <div className="f-tab">
              <div className="f-tab-title"><div className="f-icon">📋</div> Task routing agents</div>
            </div>
            <div className="f-tab">
              <div className="f-tab-title"><div className="f-icon">📊</div> Reporting agents</div>
              <div style={{ fontSize: '13px', color: 'rgba(55,53,47,0.5)', marginTop: '4px' }}>Summarizes, writes, and sends reports for you.</div>
            </div>
            <div className="f-tab">
              <div className="f-tab-title"><div className="f-icon">✨</div> Create your own</div>
            </div>
          </div>
          
          <div className="f-content">
            <div className="f-content-card">
              <div style={{ fontSize: '32px', color: '#2383e2', marginBottom: '16px' }}>🎯</div>
              <h3 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 16px' }}>Weekly team status <span style={{ color: 'rgba(55,53,47,0.3)' }}>@Today</span></h3>
              
              <div style={{ display: 'flex', gap: '32px', fontSize: '13px', marginBottom: '32px' }}>
                <div>
                  <div style={{ color: 'rgba(55,53,47,0.5)', marginBottom: '4px' }}>Created by</div>
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>📊 Weekly status reporter</div>
                </div>
                <div>
                  <div style={{ color: 'rgba(55,53,47,0.5)', marginBottom: '4px' }}>Created time</div>
                  <div style={{ fontWeight: 500 }}>Today</div>
                </div>
              </div>
              
              <h4 style={{ fontSize: '18px', margin: '0 0 16px' }}>This week's completed tasks:</h4>
              <ul style={{ paddingLeft: '20px', margin: '0 0 24px', lineHeight: 1.6, fontSize: '14px', color: 'rgba(55,53,47,0.8)' }}>
                <li><strong>@Jason</strong> implemented authentication flow</li>
                <li><strong>@Stephanie</strong> and <strong>@Kameron</strong> optimized database queries</li>
              </ul>
              
              <h4 style={{ fontSize: '18px', margin: '0 0 16px' }}>Today's priorities:</h4>
              <ul style={{ paddingLeft: '20px', margin: 0, lineHeight: 1.6, fontSize: '14px', color: 'rgba(55,53,47,0.8)' }}>
                <li>Finalize landing page design</li>
                <li>Deploy to production</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* SIMPLE FOOTER */}
      <footer style={{ padding: '40px 24px', borderTop: '1px solid rgba(55,53,47,0.08)', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(55,53,47,0.5)', maxWidth: '1000px', margin: '0 auto' }}>
        <div>© 2026 FlowPilot Inc.</div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <span>Privacy</span>
          <span>Terms</span>
          <span>Twitter</span>
        </div>
      </footer>
    </>
  );
}
