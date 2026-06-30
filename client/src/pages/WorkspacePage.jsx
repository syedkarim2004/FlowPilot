import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'this_week', title: 'This Week' },
  { id: 'today', title: 'Today' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'completed', title: 'Done' }
];

// Calculate column based on kanbanColumn or deadline fallback
const getTaskColumn = (task) => {
  if (task.status === 'completed') return 'completed';
  if (task.kanbanColumn) return task.kanbanColumn;
  if (task.status === 'in_progress') return 'in_progress';
  
  if (!task.deadline) return 'backlog';
  const diffDays = (new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24);
  if (diffDays > 7) return 'backlog';
  if (diffDays > 1) return 'this_week';
  return 'today';
};

// ─── SORTABLE TASK CARD ───
function SortableTaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { ...task } });

  const isCritical = task.riskScore >= 75;
  const isAtRisk = task.riskScore >= 50 && task.riskScore < 75;
  const isOnTrack = task.riskScore < 50;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'all 0.15s ease',
    ...(isDragging ? {
      boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
      borderColor: 'rgba(139,92,246,0.4)',
      transform: CSS.Transform.toString(transform) + ' rotate(1.5deg) scale(1.02)',
      zIndex: 999,
    } : {})
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (isDragging) return;
        onClick();
      }}
      className={`bg-surface-1 border rounded-xl p-4 mb-3 cursor-grab transition-all duration-200 relative flex flex-col gap-4 shadow-card
        ${isDragging ? 'border-accent-primary shadow-[0_16px_40px_rgba(0,0,0,0.6)]' : 'border-border-subtle hover:border-border-accent hover:shadow-card-hover'}
      `}
    >
      <div className="flex justify-between items-start gap-3">
        <span className="text-[14px] font-bold text-text-primary leading-tight">{task.title}</span>
        
        {isCritical && <span className="fp-badge fp-badge-critical shrink-0">CRITICAL</span>}
        {isAtRisk && !isCritical && <span className="fp-badge fp-badge-risk shrink-0">AT RISK</span>}
      </div>

      <div className="flex items-center justify-between text-[11px] text-text-muted font-medium">
        <span>{(task.subtasks || []).filter(s=>s.completed).length}/{task.subtasks?.length || 0} SUBTASKS</span>
        {task.deadline && (
           <span className="font-mono text-[10px]">{new Date(task.deadline).toLocaleDateString('en-US', { month:'short', day:'numeric'})}</span>
        )}
      </div>
    </div>
  );
}

// ─── KANBAN COLUMN ───
function KanbanColumn({ id, title, tasks, onTaskClick, isOver }) {
  return (
    <div className={`min-w-[300px] flex-1 bg-transparent flex flex-col transition-colors duration-200 rounded-2xl
      ${isOver ? 'bg-surface-2/30 border border-dashed border-accent-primary/40' : 'border border-transparent'}
    `}>
      <div className="p-4 mb-2 flex items-center justify-between sticky top-0 bg-bg/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <span className="text-[12px] uppercase text-text-muted tracking-widest font-bold">{title}</span>
          <span className="bg-surface-3 text-text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">{tasks.length}</span>
        </div>
        <button 
          onClick={() => window.dispatchEvent(new Event('flowpilot:open-add-task'))}
          className="text-text-muted hover:text-text-primary transition-colors w-6 h-6 flex items-center justify-center text-lg bg-surface-2 rounded-md hover:bg-surface-3"
        >
          +
        </button>
      </div>
      
      <div className="flex-1 px-3 pb-8 overflow-y-auto">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(query(collection(db, 'users', user.uid, 'tasks')), (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { over } = event;
    if (!over) { setOverCol(null); return; }
    
    // Find what column we are hovering over
    const overId = over.id;
    if (COLUMNS.find(c => c.id === overId)) {
      setOverCol(overId);
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) setOverCol(getTaskColumn(overTask));
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    setOverCol(null);
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    let targetColId = over.id;
    const overTask = tasks.find(t => t.id === over.id);
    if (overTask) targetColId = getTaskColumn(overTask);

    if (COLUMNS.find(c => c.id === targetColId) && getTaskColumn(activeTask) !== targetColId) {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === active.id ? { ...t, kanbanColumn: targetColId, status: targetColId === 'completed' ? 'completed' : (t.status === 'completed' ? 'active' : t.status) } : t));
      
      try {
        await updateDoc(doc(db, 'users', user.uid, 'tasks', active.id), {
          kanbanColumn: targetColId,
          status: targetColId === 'completed' ? 'completed' : (activeTask.status === 'completed' ? 'active' : activeTask.status),
          ...(targetColId === 'completed' ? { completedAt: new Date() } : {})
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <div className="flex flex-col h-full p-8 md:p-10 w-full max-w-[1600px] mx-auto overflow-hidden">
      
      {/* Header */}
      <div className="mb-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-[32px] font-[800] tracking-tight text-text-primary">Kanban</h1>
        </div>
        <button onClick={() => window.dispatchEvent(new Event('flowpilot:open-add-task'))} className="fp-btn fp-btn-md fp-btn-primary shadow-glow">
            New Task <span className="opacity-60 ml-2 text-[10px] font-mono tracking-widest bg-black/20 px-1 rounded">⌘K</span>
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 min-h-0 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full items-start min-w-max">
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCorners} 
            onDragStart={handleDragStart} 
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => getTaskColumn(t) === col.id);
              return (
                <div key={col.id} className="h-full flex flex-col">
                  {/* Droppable invisible receiver for empty columns */}
                  <div id={col.id} className="flex-1 flex flex-col min-w-[260px]">
                    <KanbanColumn 
                      id={col.id} 
                      title={col.title} 
                      tasks={colTasks} 
                      onTaskClick={(id) => navigate('/task/' + id)} 
                      isOver={overCol === col.id}
                    />
                  </div>
                </div>
              );
            })}
            
            <DragOverlay>
              {activeTask ? (
                <div className="opacity-90 w-[260px]">
                  <SortableTaskCard task={activeTask} onClick={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
