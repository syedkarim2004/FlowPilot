import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

// Lazy-loaded pages for performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MyTasksPage = lazy(() => import('./pages/MyTasksPage'));
const TaskDetailPage = lazy(() => import('./pages/TaskDetailPage'));
const RescueModePage = lazy(() => import('./pages/RescueModePage'));
const AIChatPage = lazy(() => import('./pages/AIChatPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const WorkspacePage = lazy(() => import('./pages/WorkspacePage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const GoalDetailPage = lazy(() => import('./pages/GoalDetailPage'));
const CoachPage = lazy(() => import('./pages/CoachPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const TelegramCompanionPage = lazy(() => import('./pages/TelegramCompanionPage'));

function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: '12px',
    }}>
      <div className="fp-spinner" />
      <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading...</span>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected with sidebar layout */}
        <Route element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<MyTasksPage />} />
          <Route path="/task/:taskId" element={<TaskDetailPage />} />
          <Route path="/rescue/:taskId" element={<RescueModePage />} />
          <Route path="/chat" element={<AIChatPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/goals/:goalId" element={<GoalDetailPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/coach" element={<CoachPage />} />
          <Route path="/telegram" element={<TelegramCompanionPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
