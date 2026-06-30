import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

export default function NotificationManager() {
  const { user } = useAuth();
  const notifiedTasks = useRef(new Set());

  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (!user || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const q = query(collection(db, 'users', user.uid, 'tasks'));
    const unsub = onSnapshot(q, (snap) => {
      snap.docs.forEach(doc => {
        const task = { id: doc.id, ...doc.data() };
        if (task.status === 'completed') return;

        // Condition 1: Extremely high risk
        if (task.riskScore > 90 && !notifiedTasks.current.has(`${task.id}-risk`)) {
          new Notification('CRITICAL RISK: ' + task.title, {
            body: 'Risk score is ' + task.riskScore + '. Action required immediately.',
            icon: '/favicon.ico' // Or whatever icon
          });
          notifiedTasks.current.add(`${task.id}-risk`);
        }

        // Condition 2: Imminent deadline (within 2 hours)
        if (task.deadline) {
          const hoursLeft = (new Date(task.deadline) - new Date()) / 3600000;
          if (hoursLeft > 0 && hoursLeft <= 2 && !notifiedTasks.current.has(`${task.id}-deadline`)) {
            new Notification('IMMINENT DEADLINE: ' + task.title, {
              body: `Due in ${Math.round(hoursLeft * 60)} minutes. Focus now!`,
              icon: '/favicon.ico'
            });
            notifiedTasks.current.add(`${task.id}-deadline`);
          }
        }
      });
    });

    return unsub;
  }, [user]);

  return null; // This is a headless component
}
