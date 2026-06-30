import { useState, useRef, useEffect } from 'react';
import { taskAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export default function QuickCaptureFAB() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = (e) => {
    e.preventDefault();
    if (!recognitionRef.current) return;
    if (isListening) recognitionRef.current.stop();
    else { recognitionRef.current.start(); setIsListening(true); }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setError('');
        setSuccess(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await taskAPI.analyze({ title: prompt.trim() });
      const taskData = res.data || res;
      const saveTask = async (data) => {
        if (!user) {
          console.error('Cannot save task: user not logged in');
          return null;
        }
        try {
          const docRef = await addDoc(
            collection(db, 'users', user.uid, 'tasks'),
            {
              title: data.title || 'Untitled Task',
              description: data.description || '',
              deadline: data.deadline || null,
              category: data.category || 'General',
              estimatedHours: data.estimatedHours || 1,
              priority: data.priorityScore || 50,
              riskScore: data.riskScore || 30,
              subtasks: data.subtasks || [],
              status: 'active',
              createdAt: serverTimestamp(),
              completedAt: null,
              notes: '',
            }
          );
          console.log('Task saved with ID:', docRef.id);
          return docRef.id;
        } catch (error) {
          console.error('FIRESTORE SAVE ERROR:', error);
          throw error;
        }
      };

      if (taskData) {
        await saveTask({
          title: prompt.trim(),
          description: taskData.description || '',
          deadline: taskData.deadline || null,
          category: taskData.category || 'General',
          estimatedHours: taskData.estimatedHours || 1,
          priority: taskData.priorityScore || 50,
          riskScore: taskData.riskScore || 50,
          subtasks: taskData.subtasks || [],
        });
        setSuccess(true);
        addToast('Task captured successfully!', 'success');
        setPrompt('');
        setIsOpen(false);
        setSuccess(false);
      } else {
        throw new Error('Failed to analyze task');
      }
    } catch (err) {
      setError(err.message || 'Failed to capture task');
      addToast(err.message || 'Failed to capture task', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 select-none">
      {/* Capture Dialog Overlay Card */}
      {isOpen && (
        <div className="fp-card p-4 w-[340px] shadow-lg border border-border bg-card animate-scale-in flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span>✦</span> Quick Capture Task
            </span>
            <button
              onClick={() => { setIsOpen(false); setError(''); }}
              className="text-text-tertiary hover:text-text-primary p-0.5 rounded hover:bg-surface border-none bg-transparent cursor-pointer transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g., Finish report tomorrow 9 PM"
                className="fp-input py-2.5 text-xs"
                style={{flex: 1}}
                disabled={loading || success}
              />
              <button type="button" onClick={toggleListening} style={{
                width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                background: isListening ? 'rgba(242,139,130,0.2)' : 'rgba(255,255,255,0.06)',
                color: isListening ? '#f28b82' : 'var(--text-3)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: isListening ? 'pulse-red 1.5s infinite' : 'none'
              }}>🎤</button>
            </div>

            {error && (
              <div className="text-[10px] text-accent-red font-medium leading-normal bg-accent-red-bg px-2.5 py-1.5 rounded-lg border border-accent-red/10">
                {error}
              </div>
            )}

            {success && (
              <div className="text-[10px] text-accent-green font-medium leading-normal bg-accent-green-bg px-2.5 py-1.5 rounded-lg border border-accent-green/10">
                ✓ Task captured and analyzed successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !prompt.trim() || success}
              className="fp-btn fp-btn-primary fp-btn-sm py-2.5 justify-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="fp-spinner w-3.5 h-3.5 border-2 mr-2" />
                  Analyzing...
                </>
              ) : (
                '🧠 Capture with AI'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-2xl bg-accent-blue-solid hover:opacity-90 text-white flex items-center justify-center shadow-lg cursor-pointer border-none transition-transform active:scale-95 duration-150"
        aria-label="Quick capture task"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </button>
    </div>
  );
}
