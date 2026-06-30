import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { coachAPI } from '../api';

const TwinIllustration = () => (
  <svg width="180" height="150" viewBox="0 0 180 150" style={{ marginBottom: '24px' }}>
    {/* Outline face facing left */}
    <path d="M90 20 C65 20, 50 35, 45 55 C43 63, 45 70, 40 75 C37 78, 30 78, 30 82 C30 86, 35 88, 38 90 C36 100, 42 110, 52 115 C60 120, 70 120, 75 125 C78 128, 80 135, 85 135 C90 135, 95 125, 100 120 C105 115, 105 95, 105 85 C108 80, 110 50, 105 40 C100 30, 95 20, 90 20 Z" 
      fill="#E8F0FE" stroke="#1A73E8" strokeWidth="2.5" />
    
    {/* Colorful brain nodes */}
    <circle cx="70" cy="50" r="7" fill="#7B1FA2" opacity="0.8" />
    <circle cx="85" cy="45" r="8" fill="#1A73E8" opacity="0.8" />
    <circle cx="80" cy="65" r="6" fill="#34A853" opacity="0.8" />
    <circle cx="95" cy="60" r="5" fill="#FBBC05" opacity="0.8" />
    
    {/* Neural connection paths */}
    <line x1="70" y1="50" x2="85" y2="45" stroke="#1A73E8" strokeWidth="1.5" />
    <line x1="70" y1="50" x2="80" y2="65" stroke="#1A73E8" strokeWidth="1.5" />
    <line x1="85" y1="45" x2="95" y2="60" stroke="#1A73E8" strokeWidth="1.5" />
    <line x1="80" y1="65" x2="95" y2="60" stroke="#1A73E8" strokeWidth="1.5" />
    
    {/* Database on the right */}
    <g transform="translate(130, 60)">
      {/* Top cylinder */}
      <rect x="0" y="0" width="24" height="28" rx="4" fill="#E8F0FE" stroke="#1A73E8" strokeWidth="2" />
      <line x1="4" y1="7" x2="20" y2="7" stroke="#1A73E8" strokeWidth="2" />
      <line x1="4" y1="14" x2="20" y2="14" stroke="#1A73E8" strokeWidth="2" />
      <line x1="4" y1="21" x2="20" y2="21" stroke="#1A73E8" strokeWidth="2" />
      
      {/* Connecting lines from brain to database */}
      <path d="M-35,-5 L-4,7" fill="none" stroke="#1A73E8" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M-35,-15 L-4,7" fill="none" stroke="#1A73E8" strokeWidth="1.5" strokeDasharray="3 3" />
    </g>
  </svg>
);

const GIcon = ({size=18}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function CoachPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Load existing profile if it exists
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'coach', 'profile');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      } catch (err) {
        console.error("Failed to load coach profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleGenerateProfile = async () => {
    setGenerating(true);
    setError('');
    
    try {
      const tasksSnap = await getDocs(query(collection(db, 'users', user.uid, 'tasks')));
      const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const goalsSnap = await getDocs(query(collection(db, 'users', user.uid, 'goals')));
      const goals = goalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const response = await coachAPI.getProfile(tasks, goals);
      const newProfile = response.data;

      if (!newProfile || !newProfile.archetype) {
        throw new Error("Invalid response from AI");
      }

      const profileData = {
        ...newProfile,
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', user.uid, 'coach', 'profile'), profileData);
      
      setProfile(profileData);
    } catch (err) {
      console.error(err);
      setError("Failed to generate your Productivity Twin: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--text-3)', fontSize: '13px' }}>Loading Productivity Twin...</div>;
  }

  return (
    <div className="animate-in r-pad" style={{ padding: '8px 4px 60px' }}>
      
      {/* ─── Header ─── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'var(--text-1)', margin: '0 0 4px' }}>
          Productivity Twin
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
          Analyze patterns, deadline adherence, and daily routines to co-create a personalized profile. This twin helps optimize your workflow.
        </p>
      </div>

      {error && (
        <div style={{
          marginBottom: '20px', padding: '12px 16px', borderRadius: '8px',
          background: 'var(--red-light)', border: '1px solid #FCBFBE',
          color: 'var(--red)', fontSize: '13px', fontWeight: 500
        }}>
          {error}
        </div>
      )}

      {/* ─── Profile NOT Generated ─── */}
      {!profile && !generating && (
        <div className="g-card" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '32px' }}>
          <TwinIllustration />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '6px' }}>Ready to co-create your Digital twin?</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginBottom: '20px', maxWidth: '400px', lineHeight: 1.5 }}>
            Generate your initial Productivity Twin profile using your past Workspace performance.
          </p>
          <button onClick={handleGenerateProfile} className="g-btn g-btn-outlined" style={{ gap: '8px' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--blue)' }}>+</span> Co-Create Profile
          </button>
        </div>
      )}

      {/* ─── Generating Profile State ─── */}
      {generating && (
        <div className="g-card" style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '32px' }}>
          <div className="fp-spinner mb-8" style={{ width: '40px', height: '40px', borderWidth: '3.5px' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '6px' }}>Analyzing Behavioral Patterns...</h2>
          <p style={{ color: 'var(--text-3)', fontSize: '12px' }}>Reading task history, deadline accuracy, and procrastination metrics.</p>
        </div>
      )}

      {/* ─── Profile Generated Archetype ─── */}
      {profile && !generating && (() => {
        const desc = profile.description || "A driven individual focused on mastering their craft through consistent effort and structured habits.";
        const superpowers = profile.superpowers?.length > 0 ? profile.superpowers : ["Getting started on tasks quickly", "Setting clear actionable goals"];
        const weaknesses = profile.weaknesses?.length > 0 ? profile.weaknesses : ["Task completion follow-through", "Potential for procrastination on remaining tasks"];
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
            {/* Archetype Card */}
            <div className="g-card" style={{ padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div className="g-label" style={{ marginBottom: '8px', color: 'var(--blue)' }}>
                Your Archetype
              </div>
              <h2 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '14px', letterSpacing: '-0.5px' }}>
                {profile.archetype}
              </h2>
              <p style={{ fontSize: '15px', italic: 'true', color: 'var(--text-2)', maxWidth: '560px', lineHeight: 1.6, margin: '0 0 24px', fontStyle: 'italic' }}>
                "{desc}"
              </p>
              <button onClick={handleGenerateProfile} className="g-btn g-btn-outlined">
                Recalibrate Profile
              </button>
            </div>

            {/* Powers & Weaknesses Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="r-grid-1">
              
              {/* Superpowers */}
              <div className="g-card" style={{ borderLeft: '3px solid var(--green-google)', padding: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚡</span> Superpowers
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {superpowers.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-2)' }}>
                      <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>✓</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kryptonite */}
              <div className="g-card" style={{ borderLeft: '3px solid var(--red-google)', padding: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚠</span> Kryptonite
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {weaknesses.map((w, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-2)' }}>
                      <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>✕</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ─── Twin Overview Slots (Coming Soon) ─── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>Twin Overview (Coming Soon)</span>
          <GIcon size={14} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }} className="r-grid-1">
          <div className="g-card" style={{ height: '70px' }} />
          <div className="g-card" style={{ height: '70px' }} />
          <div className="g-card" style={{ height: '70px' }} />
        </div>
      </div>

      {/* ─── footer brand ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContext: 'center', justifyContent: 'center', gap: '4px', margin: '32px 0 16px', fontSize: '12px', color: 'var(--text-3)' }}>
        <span style={{ fontWeight: 400 }}>powered by</span>
        <span style={{ color: '#4285F4', fontWeight: 700 }}>G</span>
        <span style={{ color: '#EA4335', fontWeight: 700 }}>o</span>
        <span style={{ color: '#FBBC05', fontWeight: 700 }}>o</span>
        <span style={{ color: '#4285F4', fontWeight: 700 }}>g</span>
        <span style={{ color: '#34A853', fontWeight: 700 }}>l</span>
        <span style={{ color: '#EA4335', fontWeight: 700 }}>e</span>
        <span style={{ fontWeight: 700, marginLeft: '2px', color: 'var(--text-2)' }}>Gemini</span>
      </div>

    </div>
  );
}
