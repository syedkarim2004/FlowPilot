import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { marked } from 'marked';

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');

  const [noteText, setNoteText] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    const ref = doc(db, 'users', user.uid, 'tasks', taskId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const t = { id: snap.id, ...snap.data() };
        setTask(t);
        setEditTitle(t.title || '');
        setEditDesc(t.description || '');
        setNoteText(t.notes || '');
      } else {
        setTask(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [taskId, user, authLoading]);

  // Derived state
  const subtasks = task?.subtasks || [];
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const progressPercent = totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);
  
  const comments = task?.comments || [];
  const historyLogs = task?.history || [];

  const timeRemaining = useMemo(() => {
    if (!task?.deadline) return null;
    const diff = new Date(task.deadline) - new Date();
    if (diff <= 0) return { text: 'OVERDUE', urgent: true };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    if (days > 0) return { text: `${days}d ${hours}h left`, urgent: false };
    return { text: `${hours}h left`, urgent: true };
  }, [task?.deadline]);

  // -- Update functions --
  const updateTaskData = async (updates, logMsg) => {
    try {
      const ref = doc(db, 'users', user.uid, 'tasks', taskId);
      const newHistory = logMsg ? [{ action: logMsg, timestamp: new Date().toISOString() }, ...historyLogs] : historyLogs;
      await updateDoc(ref, { ...updates, history: newHistory });
    } catch (e) {
      addToast('Failed to update task', 'error');
    }
  };

  const saveTitle = () => {
    setIsEditingTitle(false);
    if (editTitle.trim() && editTitle.trim() !== task.title) {
      updateTaskData({ title: editTitle.trim() }, `Renamed task to "${editTitle.trim()}"`);
    } else {
      setEditTitle(task.title);
    }
  };

  const saveDesc = () => {
    setIsEditingDesc(false);
    if (editDesc !== task.description) {
      updateTaskData({ description: editDesc }, 'Updated description');
    }
  };

  const saveNotes = (val) => {
    setNoteText(val);
    updateTaskData({ notes: val }, null);
  };

  const handleToggleSubtask = (index) => {
    const updated = [...subtasks];
    updated[index].completed = !updated[index].completed;
    updateTaskData({ subtasks: updated }, `Marked subtask "${updated[index].title}" as ${updated[index].completed ? 'done' : 'incomplete'}`);
  };

  const handleDeleteSubtask = (index) => {
    const updated = [...subtasks];
    const removed = updated.splice(index, 1)[0];
    updateTaskData({ subtasks: updated }, `Deleted subtask "${removed.title}"`);
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) {
      setIsAddingSubtask(false);
      return;
    }
    const updated = [...subtasks, { title: newSubtaskTitle.trim(), completed: false }];
    updateTaskData({ subtasks: updated }, `Added subtask "${newSubtaskTitle.trim()}"`);
    setNewSubtaskTitle('');
    setIsAddingSubtask(false);
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    const newC = {
      id: Date.now().toString(),
      text: commentInput.trim(),
      author: user.displayName || 'User',
      timestamp: new Date().toISOString()
    };
    updateTaskData({ comments: [...comments, newC] }, 'Added a comment');
    setCommentInput('');
  };

  const handleDeleteTask = async () => {
    if (window.confirm('Delete this task? This cannot be undone.')) {
      await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId));
      addToast('Task deleted', 'info');
      navigate('/dashboard');
    }
  };

  if (loading) return <div className="p-8 text-[#52525B] text-[13px]">Loading task details...</div>;
  if (!task) return (
    <div className="p-8 flex flex-col items-center justify-center h-full">
      <div className="text-[40px] mb-4">🔍</div>
      <h2 className="text-[20px] font-bold text-[#FAFAFA] mb-2">Task Not Found</h2>
      <p className="text-[#A1A1AA] text-[13px] mb-6">This task may have been deleted.</p>
      <button onClick={() => navigate('/dashboard')} className="fp-btn fp-btn-md fp-btn-secondary">Back to Dashboard</button>
    </div>
  );

  return (
    <div className="flex w-full h-full p-10 gap-16 max-w-[1400px] mx-auto overflow-y-auto pb-24">
      
      {/* ─── LEFT COLUMN (65%) Canvas ─── */}
      <div className="flex-[6.5] flex flex-col gap-12 min-w-0">
        
        {/* Breadcrumb & Meta */}
        <div className="flex items-center gap-2 mb-2">
          <Link to="/dashboard" className="text-text-muted hover:text-text-primary text-[13px] flex items-center gap-2 transition-colors font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Dashboard / Task
          </Link>
        </div>
        
        {/* Title & Description */}
        <div className="flex flex-col gap-6">
          {isEditingTitle ? (
            <input 
              autoFocus
              className="bg-transparent border-none text-[32px] font-[800] text-text-primary outline-none tracking-tight leading-tight w-full placeholder-text-muted/50"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => e.key === 'Enter' && saveTitle()}
              placeholder="Task Title"
            />
          ) : (
            <h1 
              onClick={() => setIsEditingTitle(true)}
              className="text-[32px] font-[800] text-text-primary cursor-pointer hover:bg-surface-2 rounded-lg px-2 -ml-2 transition-colors tracking-tight leading-tight min-h-[40px] flex items-center"
            >
              {task.title}
            </h1>
          )}

          {isEditingDesc ? (
            <textarea 
              autoFocus
              className="bg-surface-1 border border-border-subtle rounded-xl p-4 text-[15px] text-text-primary outline-none min-h-[120px] focus:border-border-accent shadow-inner resize-y w-full leading-relaxed"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              onBlur={saveDesc}
              placeholder="Add a detailed description..."
            />
          ) : (
            <p 
              onClick={() => setIsEditingDesc(true)}
              className="text-[15px] text-text-secondary cursor-pointer hover:bg-surface-2 rounded-xl p-3 -ml-3 transition-colors min-h-[60px] whitespace-pre-wrap leading-relaxed"
            >
              {task.description || 'Add a detailed description...'}
            </p>
          )}
        </div>

        {/* Subtasks */}
        <div className="flex flex-col gap-4">
          <div className="label-caps text-text-muted">Subtasks</div>
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-4">
              <div className="h-[4px] flex-1 bg-surface-3 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-accent-primary transition-all duration-300" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-[12px] font-bold text-accent-primary w-10 text-right">{progressPercent}%</span>
            </div>
          )}
          <div className="flex flex-col gap-1 mt-2">
            {subtasks.map((st, i) => (
              <div key={i} className="group flex items-start gap-3 p-2.5 hover:bg-surface-2 rounded-xl transition-colors">
                <button 
                  onClick={() => handleToggleSubtask(i)}
                  className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-[2px] transition-all
                    ${st.completed ? 'bg-success border-success text-white' : 'border-border-subtle hover:border-success'}
                  `}
                >
                  {st.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                </button>
                <span className={`text-[14px] flex-1 leading-snug transition-colors font-medium ${st.completed ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                  {st.title}
                </span>
                <button 
                  onClick={() => handleDeleteSubtask(i)}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all p-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            ))}
            
            {isAddingSubtask ? (
              <form onSubmit={handleAddSubtask} className="flex items-center gap-3 p-2.5 bg-surface-2 rounded-xl border border-border-subtle">
                <div className="w-5 h-5 rounded border border-border-subtle shrink-0 opacity-50" />
                <input 
                  autoFocus
                  type="text"
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  onBlur={handleAddSubtask}
                  placeholder="What needs to be done?"
                  className="flex-1 bg-transparent border-none text-[14px] text-text-primary placeholder:text-text-muted outline-none"
                />
              </form>
            ) : (
              <button 
                onClick={() => setIsAddingSubtask(true)}
                className="flex items-center gap-3 p-2.5 text-[14px] text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-xl transition-colors font-medium"
              >
                <div className="w-5 h-5 flex items-center justify-center text-lg">+</div>
                Add subtask
              </button>
            )}
          </div>
        </div>

        {/* Notes Split View */}
        <div className="flex flex-col gap-4 mt-6">
          <div className="label-caps text-text-muted">Workspace Notes</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <textarea 
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              onBlur={e => saveNotes(e.target.value)}
              placeholder="Write markdown notes here..."
              className="bg-surface-1 border border-border-subtle rounded-2xl p-5 text-[14px] text-text-primary min-h-[300px] outline-none focus:border-border-accent transition-colors resize-y font-mono shadow-inner"
            />
            <div className="bg-transparent border border-border-subtle rounded-2xl p-5 min-h-[300px] overflow-y-auto markdown-body">
              {noteText ? (
                <div dangerouslySetInnerHTML={{ __html: marked.parse(noteText) }} />
              ) : (
                <span className="text-text-muted text-[13px] italic">Markdown preview will appear here...</span>
              )}
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="flex flex-col gap-4 mt-6">
          <div className="label-caps text-text-muted">Discussion</div>
          <div className="flex flex-col gap-4 mb-2">
            {comments.map(c => (
              <div key={c.id} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-surface-3 border border-border-subtle flex items-center justify-center text-[12px] font-bold text-text-primary shrink-0 shadow-sm">
                  {c.author.charAt(0)}
                </div>
                <div className="flex flex-col flex-1 bg-surface-1 border border-border-subtle rounded-[0_16px_16px_16px] p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[13px] font-bold text-text-primary">{c.author}</span>
                    <span className="text-[11px] text-text-muted font-mono">{new Date(c.timestamp).toLocaleString()}</span>
                  </div>
                  <span className="text-[14px] text-text-secondary leading-relaxed">{c.text}</span>
                </div>
              </div>
            ))}
            {comments.length === 0 && <span className="text-[13px] text-text-muted">No comments yet.</span>}
          </div>
          <form onSubmit={handlePostComment} className="flex items-center gap-3 mt-4">
            <input 
              type="text"
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder="Write a comment..."
              className="fp-input flex-1 bg-surface-1 rounded-xl h-12 px-4 shadow-inner border-border-subtle focus:border-border-accent"
            />
            <button type="submit" className="fp-btn fp-btn-lg fp-btn-secondary" disabled={!commentInput.trim()}>Post</button>
          </form>
        </div>

        {/* Activity Timeline */}
        <div className="flex flex-col gap-4 mt-8 pb-12">
          <div className="label-caps text-text-muted">Activity History</div>
          <div className="flex flex-col relative pl-3">
            <div className="absolute left-[15px] top-3 bottom-3 w-[2px] bg-border-subtle" />
            {historyLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-6 mb-5 relative z-10">
                <div className="w-[10px] h-[10px] rounded-full bg-text-muted shrink-0 mt-1.5 ml-[-1px] shadow-[0_0_0_4px_var(--bg)]" />
                <div className="flex flex-col">
                  <span className="text-[13px] text-text-secondary font-medium">{log.action}</span>
                  <span className="text-[11px] text-text-muted mt-1 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {historyLogs.length === 0 && <span className="text-[13px] text-text-muted ml-8">No activity recorded.</span>}
          </div>
        </div>

      </div>

      {/* ─── RIGHT COLUMN (35%) Sticky Sidebar ─── */}
      <div className="flex-[3.5] sticky top-8 self-start flex flex-col gap-4 min-w-[300px]">
        
        <div className="bg-surface-1/50 border border-border-subtle rounded-2xl p-5 flex items-center justify-between shadow-card">
          <span className="text-[13px] text-text-muted font-medium">Status</span>
          <select 
            value={task.status || 'active'}
            onChange={e => updateTaskData({ status: e.target.value }, `Changed status to ${e.target.value}`)}
            className="bg-transparent border-none text-[14px] text-text-primary font-bold outline-none cursor-pointer text-right appearance-none hover:text-accent-primary transition-colors"
          >
            <option value="backlog">Backlog</option>
            <option value="today">Today</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Done</option>
            <option value="active">Active (Legacy)</option>
          </select>
        </div>

        <div className="bg-surface-1/50 border border-border-subtle rounded-2xl p-5 flex items-center justify-between shadow-card">
          <span className="text-[13px] text-text-muted font-medium">Deadline</span>
          <div className="flex items-center gap-3">
            {timeRemaining?.urgent && <span className="bg-danger/10 text-danger border border-danger/20 text-[10px] font-bold px-1.5 py-0.5 rounded">URGENT</span>}
            <input 
              type="datetime-local"
              value={task.deadline ? task.deadline.slice(0, 16) : ''}
              onChange={e => updateTaskData({ deadline: e.target.value }, 'Updated deadline')}
              className="bg-transparent border-none text-[13px] text-text-primary outline-none font-mono font-medium hover:text-accent-primary transition-colors"
            />
          </div>
        </div>

        <div className="bg-surface-1/50 border border-border-subtle rounded-2xl p-5 flex flex-col gap-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-text-muted font-medium">Priority</span>
            <span className="text-[14px] font-mono font-bold text-text-primary">{task.priority || 50}</span>
          </div>
          <input 
            type="range" min="0" max="100" step="5"
            value={task.priority || 50}
            onChange={e => updateTaskData({ priority: Number(e.target.value) }, null)}
            className="w-full accent-accent-primary h-[6px] bg-surface-3 rounded-full appearance-none cursor-pointer"
          />
        </div>

        <div className="bg-surface-1/50 border border-border-subtle rounded-2xl p-5 flex flex-col gap-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-text-muted font-medium">AI Risk Score</span>
            <span className={`text-[14px] font-mono font-bold ${task.riskScore >= 75 ? 'text-danger' : task.riskScore >= 50 ? 'text-warning' : 'text-success'}`}>
              {task.riskScore || 30}
            </span>
          </div>
          <div className="h-[6px] w-full bg-surface-3 rounded-full overflow-hidden shadow-inner">
            <div className="h-full transition-all duration-500" style={{ 
              width: `${task.riskScore || 30}%`, 
              backgroundColor: task.riskScore >= 75 ? 'var(--danger)' : task.riskScore >= 50 ? 'var(--warning)' : 'var(--success)' 
            }} />
          </div>
        </div>

        <div className="bg-surface-1/50 border border-border-subtle rounded-2xl p-5 flex items-center justify-between shadow-card">
          <span className="text-[13px] text-text-muted font-medium">Est. Hours</span>
          <input 
            type="number" min="0.5" step="0.5"
            value={task.estimatedHours || 1}
            onChange={e => updateTaskData({ estimatedHours: Number(e.target.value) }, 'Updated est. hours')}
            className="w-20 bg-surface-2 border border-border-subtle rounded-lg p-1.5 text-[14px] font-mono text-text-primary font-bold text-center outline-none focus:border-border-accent shadow-inner transition-colors"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {(task.riskScore >= 75 || timeRemaining?.urgent) && (
            <button onClick={() => navigate('/rescue/'+taskId)} className="fp-btn fp-btn-lg bg-danger/10 text-danger hover:bg-danger/20 border border-danger/30 w-full justify-center shadow-[0_0_24px_rgba(239,68,68,0.15)] font-bold tracking-wide">
              ⚡ ENTER RESCUE MODE
            </button>
          )}
          <button onClick={handleDeleteTask} className="fp-btn fp-btn-lg fp-btn-ghost text-text-muted hover:text-danger w-full justify-center font-medium">
            Delete Task
          </button>
        </div>

      </div>
    </div>
  );
}
