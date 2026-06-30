import { useState, useRef, useEffect } from 'react';
import { chatAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

const GIcon = ({size=18}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function AIChatPage() {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [goals, setGoals] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  function cleanAIMessage(raw) {
    if (!raw || typeof raw !== 'string') return '';
    return raw.replace(/\[ACTION:\s*\{[\s\S]*?\}\]/g, '').trim();
  }

  async function saveTask(taskData) {
    if (!user) return null;
    try {
      const docRef = await addDoc(
        collection(db, 'users', user.uid, 'tasks'),
        {
          title: taskData.title || 'Untitled Task',
          description: taskData.description || '',
          deadline: taskData.deadline || null,
          estimatedHours: taskData.estimatedHours || 1,
          priority: taskData.priority || 50,
          riskScore: taskData.riskScore || 30,
          subtasks: taskData.subtasks || [],
          status: 'active',
          createdAt: serverTimestamp(),
          completedAt: null,
          notes: '',
        }
      );
      return docRef.id;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // Load active tasks for context
  useEffect(() => {
    if (authLoading || !user) return;
    const q = query(
      collection(db, 'users', user.uid, 'tasks'),
      // Remove where clause if it wasn't imported, but user instructions say to use it
    );
    const unsub = onSnapshot(query(collection(db, 'users', user.uid, 'tasks'), orderBy('createdAt', 'desc')), (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user, authLoading]);

  // Load goals for context
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'goals'));
    const unsub = onSnapshot(q, snap => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error(err));
    return unsub;
  }, [user]);

  // Load chat history list
  useEffect(() => {
    if (authLoading || !user) return;
    const unsub = onSnapshot(query(collection(db, 'users', user.uid, 'conversations'), orderBy('updatedAt', 'desc')), (snapshot) => {
      const history = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setConversations(history);
      if (history.length > 0 && !currentConvId) {
        setCurrentConvId(history[0].id);
      }
    });
    return unsub;
  }, [user, authLoading, currentConvId]);

  // Load messages for current conversation
  useEffect(() => {
    if (!currentConvId || !user) { setMessages([]); return; }
    const unsub = onSnapshot(
      query(collection(db, 'users', user.uid, 'conversations', currentConvId, 'messages'), orderBy('timestamp', 'asc')),
      (snapshot) => {
        setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    );
    return unsub;
  }, [currentConvId, user]);

  const handleNewChat = async () => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'conversations'), {
        title: 'New Conversation',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      setCurrentConvId(docRef.id);
      setMessages([]);
    } catch (e) { addToast('Failed to create chat', 'error'); }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');
    setIsTyping(true);

    // Auto-create conversation if none exists
    let convId = currentConvId;
    if (!convId && user) {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'conversations'), {
        title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      convId = docRef.id;
      setCurrentConvId(convId);
    }

    // Add user message to UI immediately
    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    // Save user message to Firestore
    if (user && convId) {
      try {
        await addDoc(
          collection(db, 'users', user.uid, 'conversations', convId, 'messages'),
          { role: 'user', content: text, timestamp: serverTimestamp() }
        );
      } catch (e) { console.error('Save user msg error:', e); }
    }

    try {
      const token = await user.getIdToken();
      const API = import.meta.env.VITE_API_URL || '';
      
      const response = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          tasks: tasks,
          goals: goals,
        })
      });
      const data = await response.json();

      const { message: aiText, actions = [] } = data;

      const aiMsg = {
        role: 'assistant',
        content: aiText,
        actionsExecuted: [],
        timestamp: new Date(),
      };

      // Execute actions
      for (const action of actions) {
        if (action.type === 'ADD_TASK' && action.data?.title) {
          try {
            await addDoc(collection(db, 'users', user.uid, 'tasks'), {
              title: action.data.title,
              description: action.data.description || '',
              deadline: action.data.deadline ? new Date(action.data.deadline).toISOString() : null,
              estimatedHours: action.data.estimatedHours || 1,
              priority: action.data.priority || 50,
              riskScore: action.data.riskScore || 30,
              subtasks: [],
              status: 'active',
              createdAt: serverTimestamp(),
              completedAt: null,
              notes: '',
              labels: action.data.labels || [],
              kanbanColumn: 'backlog',
            });
            aiMsg.actionsExecuted.push({ type: 'ADD_TASK', data: action.data });
          } catch (e) { console.error('ADD_TASK failed:', e); }
        }

        if (action.type === 'UPDATE_TASK' && action.taskId) {
          try {
            const target = tasks.find(t =>
              t.id === action.taskId ||
              t.title?.toLowerCase() === action.taskId?.toLowerCase()
            );
            if (target) {
              await updateDoc(doc(db, 'users', user.uid, 'tasks', target.id), action.data);
              aiMsg.actionsExecuted.push({ type: 'UPDATE_TASK', data: action.data });
            }
          } catch (e) { console.error('UPDATE_TASK failed:', e); }
        }
      }

      setMessages(prev => [...prev, aiMsg]);

      if (user && convId) {
        try {
          await addDoc(
            collection(db, 'users', user.uid, 'conversations', convId, 'messages'),
            { role: 'assistant', content: aiText, timestamp: serverTimestamp(), actionsExecuted: aiMsg.actionsExecuted }
          );
        } catch (e) { console.error('Save AI msg error:', e); }
      }

    } catch (err) {
      console.error('Send message error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't connect right now. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMic = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      addToast('Speech recognition not supported in this browser.', 'error');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => setInput(prev => prev + (prev ? ' ' : '') + event.results[0][0].transcript);
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  return (
    <div className="flex h-full w-full bg-surface-2" style={{ height: 'calc(100vh - 64px)' }}>
      
      {/* ─── LEFT COLUMN: Conversations Sidebar ─── */}
      <div style={{ width: '280px', background: '#FFFFFF', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        
        {/* Sidebar Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 600, color: 'var(--text-1)' }}>
            <span style={{ color: 'var(--blue)', fontSize: '16px' }}>✦</span> AI Agent
          </div>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '50%' }} onClick={handleNewChat} title="New Chat" className="hover:bg-surface-2">
            ⋮
          </button>
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {conversations.map(conv => {
              const isSelected = currentConvId === conv.id;
              return (
                <div 
                  key={conv.id} 
                  onClick={() => setCurrentConvId(conv.id)}
                  style={{
                    padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                    background: isSelected ? 'var(--blue-light)' : 'transparent',
                  }}
                  className={isSelected ? '' : 'hover:bg-surface-2'}
                >
                  <div style={{
                    fontSize: '13px', fontWeight: isSelected ? 500 : 400, color: isSelected ? 'var(--blue)' : 'var(--text-1)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {conv.title}
                  </div>
                  {conv.updatedAt && (
                    <div style={{ fontSize: '11px', marginTop: '4px', color: isSelected ? 'var(--blue)' : 'var(--text-3)', opacity: isSelected ? 0.8 : 1 }}>
                      {conv.updatedAt.toDate ? conv.updatedAt.toDate().toLocaleDateString() : 'Just now'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── RIGHT COLUMN: Chat Workspace ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#F8F9FA' }}>
        
        {/* Transparent Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: 'transparent' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 500 }}>
            {conversations.find(c => c.id === currentConvId)?.title || 'AI Agent'}
          </span>
          <button onClick={() => setMessages([])} className="g-btn g-btn-outlined" style={{ height: '28px', fontSize: '11px', padding: '0 12px' }}>
            Clear Chat
          </button>
        </div>

        {/* Message Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {messages.length === 0 ? (
              <div style={{ margin: '80px auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FFFFFF', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-1)' }}>
                  <GIcon size={20} />
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-2)', margin: 0, fontWeight: 500 }}>How can I help you manage your tasks today?</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isUser = msg.role === 'user';
                if (isUser) {
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', alignSelf: 'flex-end', maxWidth: '70%' }}>
                      <div style={{
                        background: 'var(--blue-light)', color: 'var(--text-1)', fontSize: '14px', 
                        borderRadius: '20px 20px 4px 20px', padding: '12px 18px', lineHeight: 1.5,
                        boxShadow: '0 1px 2px rgba(60,64,67,.05)'
                      }}>
                        {msg.content}
                      </div>
                      {msg.timestamp && (
                        <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px', marginRight: '4px' }}>
                          {msg.timestamp.toDate ? msg.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Now'}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div key={i} style={{ display: 'flex', gap: '12px', maxWidth: '85%', alignSelf: 'flex-start' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#FFFFFF', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <GIcon size={14} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ color: 'var(--text-1)', fontSize: '14px', padding: '4px 0', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                          {msg.content}
                        </div>
                        {msg.actionsExecuted && msg.actionsExecuted.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                            {msg.actionsExecuted.map((a, idx) => (
                              <div key={idx} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: 'var(--green-light)', border: '1px solid #CEEAD6',
                                color: 'var(--green)', fontSize: '12px', fontWeight: 500,
                                padding: '4px 12px', borderRadius: '16px'
                              }}>
                                <span>✓</span> {a.type ? 'Action executed' : a}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              })
            )}

            {isTyping && (
              <div style={{ display: 'flex', gap: '12px', maxWidth: '85%', alignSelf: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#FFFFFF', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <GIcon size={14} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '32px' }}>
                  <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-[bounce_1s_infinite_0ms]" />
                  <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-[bounce_1s_infinite_200ms]" />
                  <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-[bounce_1s_infinite_400ms]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} style={{ height: '20px' }} />
          </div>
        </div>

        {/* Input Pill Bar */}
        <div style={{ padding: '16px 24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid var(--border-2)', borderRadius: '26px', padding: '0 8px 0 16px', height: '48px', boxShadow: '0 1px 2px rgba(60,64,67,.08), 0 2px 6px rgba(60,64,67,.08)' }}>
            <GIcon size={16} />
            <input 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Gemini"
              style={{ flex: 1, border: 'none', background: 'transparent', marginLeft: '12px', fontSize: '14px', color: 'var(--text-1)', outline: 'none' }}
              disabled={isTyping}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-3)', marginRight: '10px', fontWeight: 500 }}>Gemini</span>
            <button onClick={toggleMic} style={{ background: 'none', border: 'none', color: isListening ? 'var(--red)' : 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', marginRight: '4px' }} className="hover:bg-surface-2">
              🎙
            </button>
            <button onClick={handleSend} disabled={!input.trim() || isTyping} style={{ background: 'none', border: 'none', color: input.trim() ? 'var(--blue)' : 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%' }} className="hover:bg-surface-2">
              ➤
            </button>
          </div>
          
          {/* Powered by Google Gemini footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '16px', fontSize: '12px', color: 'var(--text-3)' }}>
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

      </div>
    </div>
  );
}
