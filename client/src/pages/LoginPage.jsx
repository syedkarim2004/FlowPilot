import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />, text: 'AI prioritizes work automatically' },
    { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />, text: 'Rescue Mode detects overdue initiatives' },
    { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />, text: 'Smart planning adapts throughout the day' },
    { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />, text: 'Unified dashboard for tasks, goals and calendars' },
    { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />, text: 'Calendar synchronization' },
    { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />, text: 'Autonomous execution assistance' },
    { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />, text: 'Predictive productivity insights' },
  ];

  const technologies = ['Gemini', 'Firebase', 'Cloud Run', 'Firestore', 'Google Cloud'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * { box-sizing: border-box; }
        html, body { height: 100%; margin: 0; background: #FFFFFF; font-family: 'Inter', -apple-system, sans-serif; }

        .auth-container {
          display: flex;
          min-height: 100vh;
          width: 100%;
        }

        /* ─── LEFT COLUMN ─── */
        .auth-left {
          flex: 0 0 55%;
          padding: 80px 80px;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #E5E7EB;
          background: #FFFFFF;
        }

        .brand-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 80px;
        }

        .brand-logo {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #2563EB;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          color: white;
        }

        .brand-name {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }

        .brand-subtitle {
          font-size: 13px;
          font-weight: 500;
          color: #6B7280;
          padding: 4px 10px;
          border-radius: 6px;
          background: #F3F4F6;
          margin-left: 8px;
        }

        .hero-title {
          font-size: 64px;
          font-weight: 800;
          letter-spacing: -2px;
          line-height: 1.05;
          color: #111827;
          margin: 0 0 24px;
        }

        .hero-title-accent {
          color: #2563EB;
          display: block;
        }

        .hero-description {
          font-size: 18px;
          line-height: 1.6;
          color: #6B7280;
          max-width: 540px;
          margin: 0 0 48px;
          font-weight: 400;
        }

        .features-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: auto;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 16px;
          color: #111827;
          font-size: 15px;
          font-weight: 500;
        }

        .feature-icon {
          width: 24px;
          height: 24px;
          color: #2563EB;
          flex-shrink: 0;
        }

        .powered-by-section {
          margin-top: 80px;
          border-top: 1px solid #E5E7EB;
          padding-top: 32px;
        }

        .powered-by-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: #6B7280;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .tech-badges {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .tech-badge {
          font-size: 13px;
          font-weight: 500;
          color: #6B7280;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid #E5E7EB;
          background: #FFFFFF;
        }

        /* ─── RIGHT COLUMN ─── */
        .auth-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: #F9FAFB;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 18px;
          padding: 48px 40px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.025);
          text-align: center;
        }

        .login-heading {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.5px;
          margin: 0 0 12px;
        }

        .login-subheading {
          font-size: 15px;
          line-height: 1.5;
          color: #6B7280;
          margin: 0 0 32px;
        }

        .google-btn {
          width: 100%;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 500;
          color: #111827;
          cursor: pointer;
          font-family: inherit;
          transition: all 180ms ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }

        .google-btn:hover:not(:disabled) {
          border-color: #D1D5DB;
          background: #F9FAFB;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          transform: translateY(-1px);
        }

        .google-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-msg {
          margin-bottom: 20px;
          padding: 12px;
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          border-radius: 8px;
          color: #DC2626;
          font-size: 14px;
          font-weight: 500;
        }

        .login-footer-text {
          margin-top: 24px;
          font-size: 13px;
          color: #6B7280;
          line-height: 1.5;
        }

        .login-legal-text {
          margin-top: 12px;
          font-size: 12px;
          color: #9CA3AF;
          line-height: 1.5;
        }

        .link {
          color: #6B7280;
          text-decoration: underline;
          cursor: pointer;
        }
        .link:hover { color: #111827; }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid #E5E7EB;
          border-top-color: #111827;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 1100px) {
          .auth-left { flex: 0 0 50%; padding: 60px 40px; }
          .hero-title { font-size: 48px; }
        }

        @media (max-width: 860px) {
          .auth-container { flex-direction: column; }
          .auth-left { 
            flex: none; 
            border-right: none; 
            border-bottom: 1px solid #E5E7EB;
            padding: 40px 24px;
          }
          .hero-title { font-size: 42px; }
          .powered-by-section { margin-top: 48px; }
          .auth-right { padding: 40px 24px; background: #FFFFFF; }
          .login-card { border: none; box-shadow: none; padding: 0; max-width: 100%; }
        }
      `}</style>

      <div className="auth-container">
        
        {/* LEFT COLUMN - BRAND & VALUE PROP */}
        <div className="auth-left">
          <div className="brand-header">
            <div className="brand-logo">F</div>
            <div className="brand-name">FlowPilot</div>
            <div className="brand-subtitle">AI Operating System</div>
          </div>

          <h1 className="hero-title">
            Your day,<br />
            <span className="hero-title-accent">handled by AI.</span>
          </h1>

          <p className="hero-description">
            FlowPilot acts like your personal execution partner. It organizes your work, prioritizes what matters, predicts delays before they happen and keeps every initiative moving forward automatically.
          </p>

          <div className="features-list">
            {features.map((feature, idx) => (
              <div key={idx} className="feature-item">
                <svg className="feature-icon" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  {feature.icon}
                </svg>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="powered-by-section">
            <div className="powered-by-title">Powered By</div>
            <div className="tech-badges">
              {technologies.map(tech => (
                <div key={tech} className="tech-badge">{tech}</div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - AUTHENTICATION */}
        <div className="auth-right">
          <div className="login-card">
            <h2 className="login-heading">Welcome to FlowPilot</h2>
            <p className="login-subheading">
              Sign in with your Google account to access your workspace, AI assistant, analytics and personalized productivity dashboard.
            </p>

            {error && <div className="error-msg">{error}</div>}

            <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
              {loading ? (
                <><div className="spinner" /><span>Signing in...</span></>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div className="login-footer-text">
              Secure authentication powered by Google and Firebase Authentication.
            </div>

            <div className="login-legal-text">
              By continuing you agree to the <span className="link">Terms of Service</span> and <span className="link">Privacy Policy</span>.
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
