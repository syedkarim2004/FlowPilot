export function getDeadlineLabel(deadline) {
  if (!deadline) return 'No deadline';
  const diff = new Date(deadline) - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return '⚠ Overdue';
  if (days === 0) return '⚡ Due today';
  if (days === 1) return '⏰ Tomorrow';
  if (days <= 3) return `🔴 in ${days} days`;
  if (days <= 7) return `🟡 in ${days} days`;
  return `in ${days} days`;
}

export function getRelativeTime(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - new Date(timestamp);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
