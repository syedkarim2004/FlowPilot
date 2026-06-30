import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const SYSTEM_COMMANDS = [
  { id: 'cmd-create', title: 'Create Task', description: 'Open manual task creator dialog', icon: '➕', action: (navigate, onClose) => { onClose(); window.dispatchEvent(new CustomEvent('flowpilot:open-add-task')); } },
  { id: 'cmd-calendar', title: 'Open Calendar', description: 'Go to schedule planner calendar', icon: '📅', action: (navigate, onClose) => { onClose(); navigate('/calendar'); } },
  { id: 'cmd-settings', title: 'Open Settings', description: 'Go to personalization settings', icon: '⚙️', action: (navigate, onClose) => { onClose(); navigate('/settings'); } },
  { id: 'cmd-chat', title: 'Ask AI', description: 'Start chatting with FlowPilot AI', icon: '✦', action: (navigate, onClose) => { onClose(); navigate('/chat'); } },
  { id: 'cmd-dashboard', title: 'Go to Dashboard', description: 'Go to main focus area', icon: '📊', action: (navigate, onClose) => { onClose(); navigate('/dashboard'); } }
];

export default function SearchBar({ isOpen, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Load all tasks once when search is opened for quick local search
  useEffect(() => {
    if (!user || !isOpen) return;

    const fetchAllTasks = async () => {
      try {
        const q = query(collection(db, 'users', user.uid, 'tasks'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const allTasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(allTasks);
      } catch {
        // Ignored
      }
    };

    fetchAllTasks();
    setSelectedIndex(0);
    setSearchQuery('');
  }, [user, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filtered combined results (Commands + Tasks)
  const combinedResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    // 1. Filter commands
    const filteredCommands = q
      ? SYSTEM_COMMANDS.filter(cmd => 
          cmd.title.toLowerCase().includes(q) || 
          cmd.description.toLowerCase().includes(q)
        )
      : SYSTEM_COMMANDS;

    // 2. Filter tasks
    const filteredTasks = q
      ? tasks.filter(t => 
          t.title?.toLowerCase().includes(q) || 
          t.description?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q)
        )
      : tasks.slice(0, 5);

    return [...filteredCommands, ...filteredTasks];
  }, [searchQuery, tasks]);

  // Reset selection index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, combinedResults.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + combinedResults.length) % Math.max(1, combinedResults.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedItem = combinedResults[selectedIndex];
        if (selectedItem) {
          if (selectedItem.action) {
            selectedItem.action(navigate, onClose);
          } else {
            navigate(`/task/${selectedItem.id}`);
            onClose();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, combinedResults, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fp-overlay animate-fade-in" onClick={onClose}>
      <div
        ref={containerRef}
        onClick={e => e.stopPropagation()}
        className="fp-card w-full max-w-[560px] max-h-[80vh] overflow-hidden p-0 animate-scale-in flex flex-col mt-[10vh]"
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <svg className="text-text-tertiary shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Type a command or search tasks..."
            className="w-full text-sm text-text-primary bg-transparent border-none outline-none placeholder-text-tertiary"
          />
          <kbd className="text-[10px] font-semibold text-text-tertiary px-2 py-0.5 rounded bg-surface border border-border shrink-0">ESC</kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-2">
          {combinedResults.length === 0 ? (
            <div className="text-center py-8 text-xs text-text-tertiary">
              No results found for "{searchQuery}"
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {combinedResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const isCommand = !!item.action;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isCommand) {
                        item.action(navigate, onClose);
                      } else {
                        navigate(`/task/${item.id}`);
                        onClose();
                      }
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border border-transparent ${
                      isSelected 
                        ? 'bg-card-hover border-border shadow-sm' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 mr-4">
                      <span className="text-base shrink-0">
                        {isCommand ? item.icon : '📌'}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-text-primary truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-text-secondary block mt-0.5 truncate">
                          {isCommand ? item.description : item.category || 'Work'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isCommand ? (
                        <span className="text-[9px] font-semibold bg-accent-blue-bg text-accent-blue px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Command
                        </span>
                      ) : (
                        <div className="text-[10px] text-text-secondary">
                          {item.progressPercent ?? 0}% done
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2.5 border-t border-border bg-surface text-[10px] text-text-tertiary flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Execute</span>
          </div>
          <span>FlowPilot Command Palette</span>
        </div>
      </div>
    </div>
  );
}
