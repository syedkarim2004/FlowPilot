import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';

export default function TaskCard({ task, index, isListView = false }) {
  const navigate = useNavigate();
  const { addToast, showToast } = useToast();
  const toast = addToast || showToast; // support both aliases
  
  const isCritical = task.riskScore >= 75;
  const isAtRisk = task.riskScore >= 50 && task.riskScore < 75;
  const isOnTrack = task.riskScore < 50;
  
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(st => st.completed || st.status === 'completed').length || 0;
  const progress = totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);
  
  let progressColor = 'var(--success)';
  if (isCritical) progressColor = 'var(--danger)';
  else if (isAtRisk) progressColor = 'var(--warning)';

  const timeRemaining = () => {
    if (!task.deadline) return null;
    const diff = new Date(task.deadline) - new Date();
    if (diff <= 0) return { text: 'OVERDUE', isOverdue: true };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    if (days > 0) return { text: `${days}d ${hours}h left`, isOverdue: false };
    return { text: `${hours}h left`, isOverdue: false };
  };

  const remaining = timeRemaining();
  const isOverdue = remaining?.isOverdue;

  const handleComplete = async (e) => {
    e.stopPropagation();
    try {
      const user = auth.currentUser;
      if (!user) return;
      await updateDoc(doc(db, 'users', user.uid, 'tasks', task.id), {
        status: 'completed',
        completedAt: serverTimestamp()
      });
      toast('Task marked complete', 'success');
    } catch (err) {
      toast('Failed to complete task', 'error');
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Delete this task? This cannot be undone.')) {
      try {
        const user = auth.currentUser;
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'tasks', task.id));
        toast('Task deleted', 'info');
      } catch (err) {
        toast('Failed to delete task', 'error');
      }
    }
  };

  if (isListView) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, delay: index * 0.02 }}
        className="group relative bg-transparent hover:bg-surface-2/50 rounded-lg p-3 flex items-center justify-between cursor-pointer transition-all duration-200 border border-transparent hover:border-border-subtle"
        onClick={() => navigate('/task/' + task.id)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-2 h-2 rounded-full ${isCritical ? 'bg-danger shadow-[0_0_8px_var(--danger)] animate-pulse-critical' : isAtRisk ? 'bg-warning opacity-80' : 'bg-accent-primary opacity-50 shadow-[0_0_8px_var(--accent-glow)]'}`} />
          <span className="text-sm font-semibold text-text-primary group-hover:text-white transition-colors">{task.title}</span>
          {isOverdue && <span className="bg-danger/10 text-danger text-[10px] font-bold px-2 py-0.5 rounded border border-danger/20">OVERDUE</span>}
        </div>

        <div className="flex items-center gap-6">
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted font-medium">{completedSubtasks}/{totalSubtasks}</span>
              <div className="w-16 h-1 bg-surface-3 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: progressColor }} />
              </div>
            </div>
          )}
          
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity duration-200">
             <button onClick={handleComplete} className="text-text-muted hover:text-success p-1.5 transition-colors" title="Complete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg></button>
             <span className="text-border-subtle">|</span>
             <button onClick={(e) => { e.stopPropagation(); navigate('/task/' + task.id); }} className="text-text-muted hover:text-text-primary p-1.5 transition-colors" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></button>
             <span className="text-border-subtle">|</span>
             <button onClick={handleDelete} className="text-text-muted hover:text-danger p-1.5 transition-colors" title="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={`relative bg-surface-1 border border-border-subtle hover:border-border-accent rounded-xl p-[16px_20px] cursor-pointer transition-all duration-200 ease-out flex flex-col gap-3 hover:shadow-card-hover hover:-translate-y-[1px] shadow-card
        ${isOverdue ? 'animate-pulse-critical' : ''}
      `}
      onClick={() => navigate('/task/' + task.id)}
    >
      {/* Overdue left border indicator */}
      {isOverdue && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-danger rounded-l-xl" />
      )}

      {/* Row 1: Title & Status Badge */}
      <div className="flex justify-between items-start gap-2">
        <span className="text-[14px] font-bold text-text-primary leading-tight truncate">{task.title}</span>
        
        {isCritical && <span className="fp-badge fp-badge-critical shrink-0">CRITICAL</span>}
        {isAtRisk && !isCritical && <span className="fp-badge fp-badge-risk shrink-0">AT RISK</span>}
        {isOnTrack && <span className="fp-badge fp-badge-track shrink-0">ON TRACK</span>}
      </div>

      {/* Row 2: Subtask count & Overdue badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {totalSubtasks > 0 && (
            <span className="text-[11px] text-text-muted font-medium tracking-wide">
              {completedSubtasks}/{totalSubtasks} SUBTASKS
            </span>
          )}
        </div>
        {isOverdue && <span className="fp-badge fp-badge-overdue shrink-0">OVERDUE</span>}
      </div>

      {/* Row 3: Progress Bar (if subtasks exist) */}
      {totalSubtasks > 0 && (
        <div className="h-[4px] w-full bg-surface-3 rounded-full overflow-hidden shadow-inner">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: progressColor }} />
        </div>
      )}

      {/* Row 4: Actions (Always visible) */}
      <div className="flex items-center gap-2 pt-3 border-t border-border-subtle mt-2">
        <button onClick={handleComplete} className="fp-btn fp-btn-sm bg-[rgba(16,185,129,0.1)] text-success hover:bg-[rgba(16,185,129,0.2)] border border-[rgba(16,185,129,0.2)]">
          ✓ Complete
        </button>
        
        {(isCritical || isOverdue) && (
          <button onClick={(e) => { e.stopPropagation(); navigate('/rescue/' + task.id); }} className="fp-btn fp-btn-sm fp-btn-danger">
            ⚡ Rescue
          </button>
        )}
        
        <button onClick={(e) => { e.stopPropagation(); navigate('/task/' + task.id); }} className="fp-btn fp-btn-sm fp-btn-ghost ml-auto text-text-secondary">
          Edit
        </button>
        <button onClick={handleDelete} className="fp-btn fp-btn-sm fp-btn-ghost hover:text-danger text-text-muted">
          Delete
        </button>
      </div>
    </motion.div>
  );
}
