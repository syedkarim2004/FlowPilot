import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full p-8 md:p-10 w-full max-w-[800px] mx-auto overflow-y-auto">
      
      <div className="mb-10 flex flex-col gap-2 shrink-0">
        <h1 className="text-[32px] font-[800] tracking-tight text-text-primary">
          Settings
        </h1>
        <p className="text-[14px] text-text-secondary font-medium">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile card */}
      <div className="bg-surface-1/50 border border-border-subtle rounded-2xl p-8 mb-6 shadow-card shrink-0">
        <div className="text-[12px] text-text-muted font-bold uppercase tracking-widest mb-6">
          Profile
        </div>
        <div className="flex items-center gap-6">
          <img src={user?.photoURL} alt="" className="w-16 h-16 rounded-full border-2 border-border-subtle shadow-sm bg-surface-2" />
          <div className="flex flex-col gap-1 flex-1">
            <div className="text-[18px] font-bold text-text-primary tracking-wide">
              {user?.displayName}
            </div>
            <div className="text-[14px] text-text-secondary font-medium">{user?.email}</div>
          </div>
          <div className="px-4 py-1.5 rounded-full text-[12px] bg-success/10 text-success border border-success/20 font-bold shadow-sm tracking-wide uppercase">
            Active
          </div>
        </div>
      </div>

      {/* App info */}
      <div className="bg-surface-1/50 border border-border-subtle rounded-2xl p-8 mb-6 shadow-card shrink-0">
        <div className="text-[12px] text-text-muted font-bold uppercase tracking-widest mb-6">
          About FlowPilot
        </div>
        <div className="flex flex-col gap-2">
          {[
            {label: 'Version', value: '2.0.0'},
            {label: 'AI Provider', value: 'Groq · Llama 3.3 70B'},
            {label: 'Database', value: 'Firebase Firestore'},
            {label: 'Auth', value: 'Google OAuth'},
            {label: 'Deployed on', value: 'Google Cloud Run'},
          ].map((item, i, arr) => (
            <div key={item.label} className={`flex justify-between items-center py-3 ${i !== arr.length - 1 ? 'border-b border-border-subtle' : ''}`}>
              <span className="text-[14px] text-text-secondary font-medium">{item.label}</span>
              <span className="text-[14px] text-text-primary font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack badges */}
      <div className="bg-surface-1/50 border border-border-subtle rounded-2xl p-8 mb-6 shadow-card shrink-0">
        <div className="text-[12px] text-text-muted font-bold uppercase tracking-widest mb-6">
          Built With
        </div>
        <div className="flex flex-wrap gap-3">
          {['React 19', 'Vite', 'Firebase', 'Groq AI', 'Llama 3.3', 'Firestore', 'Cloud Run', 'TailwindCSS'].map(tech => (
            <span key={tech} className="px-4 py-1.5 rounded-lg text-[13px] bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-bold tracking-wide shadow-sm">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-surface-1/50 border border-danger/20 rounded-2xl p-8 shadow-card shrink-0 mb-10">
        <div className="text-[12px] text-danger font-bold uppercase tracking-widest mb-6">
          Account
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <div className="text-[15px] font-bold text-text-primary">Sign out</div>
            <div className="text-[13px] text-text-secondary font-medium">You'll be redirected to the login page</div>
          </div>
          <button onClick={handleSignOut} className="fp-btn fp-btn-md bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 font-bold shadow-sm px-6">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
