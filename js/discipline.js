// js/discipline.js
import { db, ref, set, get, push, remove, onValue } from './firebase.js';
import { openModal, closeModal, showToast, todayKey, formatDate } from './app.js';

const tasksRef = ref(db, 'tasks');
const historyRef = ref(db, 'history');

let tasks = {};
let todayHistory = {};

// ===== LISTEN =====
onValue(tasksRef, snap => {
  tasks = snap.val() || {};
  renderTasks();
  updatePie();
  saveTodayHistory();
});

onValue(historyRef, snap => {
  const data = snap.val() || {};
  renderHistory(data);
});

// ===== ADD TASK =====
document.getElementById('btn-add-task').addEventListener('click', () => {
  openModal('Nouvelle tâche', `
    <input type="text" id="new-task-name" placeholder="Nom de la tâche..." />
    <button class="btn-primary full-width" id="confirm-add-task" style="margin-top:8px">Ajouter</button>
  `);
  setTimeout(() => {
    document.getElementById('new-task-name').focus();
    document.getElementById('confirm-add-task').addEventListener('click', () => {
      const name = document.getElementById('new-task-name').value.trim();
      if (!name) return;
      const newRef = push(tasksRef);
      set(newRef, { name, done: {} });
      closeModal();
      showToast('✓ Tâche ajoutée');
    });
    document.getElementById('new-task-name').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('confirm-add-task').click();
    });
  }, 50);
});

// ===== RENDER TASKS =====
function renderTasks() {
  const list = document.getElementById('task-list');
  list.innerHTML = '';
  const today = todayKey();

  if (Object.keys(tasks).length === 0) {
    list.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px">Aucune tâche. Commencez par en ajouter une !</div>';
    return;
  }

  Object.entries(tasks).forEach(([id, task]) => {
    const isDone = task.done && task.done[today];
    const div = document.createElement('div');
    div.className = `task-item${isDone ? ' done' : ''}`;
    div.innerHTML = `
      <div class="task-checkbox ${isDone ? 'checked' : ''}" data-id="${id}" title="Marquer comme fait">
        ${isDone ? '✓' : ''}
      </div>
      <span class="task-name">${escHtml(task.name)}</span>
      <button class="task-delete" data-id="${id}" title="Supprimer">✕</button>
    `;
    list.appendChild(div);
  });

  list.querySelectorAll('.task-checkbox').forEach(el => {
    el.addEventListener('click', () => toggleTask(el.dataset.id));
  });
  list.querySelectorAll('.task-delete').forEach(el => {
    el.addEventListener('click', () => deleteTask(el.dataset.id));
  });
}

function toggleTask(id) {
  const today = todayKey();
  const isDone = tasks[id]?.done?.[today];
  const path = `tasks/${id}/done/${today}`;
  set(ref(db, path), isDone ? null : true);
}

function deleteTask(id) {
  remove(ref(db, `tasks/${id}`));
  showToast('Tâche supprimée');
}

// ===== PIE CHART =====
function updatePie() {
  const today = todayKey();
  const total = Object.keys(tasks).length;
  const done = Object.values(tasks).filter(t => t.done && t.done[today]).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  // Summary text
  const summaryEl = document.getElementById('discipline-summary');
  let msg, color;
  if (pct === 100) { msg = '🔥 Parfait !'; color = 'var(--success)'; }
  else if (pct >= 75) { msg = '💪 Très bien !'; color = 'var(--accent)'; }
  else if (pct >= 50) { msg = '📈 En progrès'; color = 'var(--accent2)'; }
  else if (pct > 0) { msg = '⚡ Continue !'; color = 'var(--accent3)'; }
  else { msg = '😴 Pas encore démarré'; color = 'var(--text-muted)'; }

  summaryEl.innerHTML = `
    <div class="summary-pct" style="color:${color}">${pct}%</div>
    <div class="summary-label">${done} / ${total} tâche${done > 1 ? 's' : ''} — ${msg}</div>
  `;

  // Canvas pie
  const canvas = document.getElementById('pie-chart');
  const ctx = canvas.getContext('2d');
  const cx = 100, cy = 100, r = 80;
  ctx.clearRect(0, 0, 200, 200);

  const slices = [
    { val: done, color: '#c8f0a0' },
    { val: total - done, color: '#2a2a38' }
  ];
  let start = -Math.PI / 2;
  slices.forEach(s => {
    if (total === 0) return;
    const angle = (s.val / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();
    start += angle;
  });

  // Center hole
  ctx.beginPath();
  ctx.arc(cx, cy, 50, 0, 2 * Math.PI);
  ctx.fillStyle = '#16161d';
  ctx.fill();

  ctx.font = 'bold 22px Syne, sans-serif';
  ctx.fillStyle = '#f0eef8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${pct}%`, cx, cy);

  // Legend
  document.getElementById('pie-legend').innerHTML = `
    <div class="legend-item"><div class="legend-dot" style="background:#c8f0a0"></div>Faites (${done})</div>
    <div class="legend-item"><div class="legend-dot" style="background:#2a2a38;border:1px solid #444"></div>À faire (${total - done})</div>
  `;
}

// ===== HISTORY =====
function saveTodayHistory() {
  const today = todayKey();
  const total = Object.keys(tasks).length;
  const done = Object.values(tasks).filter(t => t.done && t.done[today]).length;
  if (total > 0) {
    set(ref(db, `history/${today}`), { done, total });
  }
}

function renderHistory(data) {
  const container = document.getElementById('history-bars');
  container.innerHTML = '';

  // Last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  days.forEach(day => {
    const entry = data[day];
    const pct = entry && entry.total > 0 ? Math.round((entry.done / entry.total) * 100) : 0;
    const wrap = document.createElement('div');
    wrap.className = 'hist-bar-wrap';
    wrap.innerHTML = `
      <div class="hist-bar" style="height:${pct}%;background:${pct >= 75 ? 'var(--accent)' : pct >= 40 ? 'var(--accent2)' : 'var(--accent3)'}" title="${pct}%"></div>
      <div class="hist-date">${formatDate(day)}</div>
    `;
    container.appendChild(wrap);
  });
}

// ===== UTILS =====
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
