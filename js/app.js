// js/app.js — Navigation + shared utilities
import { db, ref, onValue } from './firebase.js';

// ===== NAV =====
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(n => n.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));
    item.classList.add('active');
    document.getElementById(item.dataset.section).classList.add('active');
  });
});

// ===== MODAL =====
const overlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
document.getElementById('modal-close').addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

export function openModal(title, bodyHTML) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;
  overlay.classList.remove('hidden');
}

export function closeModal() {
  overlay.classList.add('hidden');
  modalBody.innerHTML = '';
}

// ===== TOAST =====
let toastTimeout;
export function showToast(msg, duration = 2500) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.add('hidden'), duration);
}

// ===== SYNC STATUS =====
const statusEl = document.getElementById('sync-status');
const connRef = ref(db, '.info/connected');
onValue(connRef, snap => {
  if (snap.val()) {
    statusEl.textContent = '● Synchronisé';
    statusEl.className = 'sync-ok';
  } else {
    statusEl.textContent = '○ Hors ligne';
    statusEl.className = 'sync-err';
  }
});

// ===== DATE UTILS =====
export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(isoStr) {
  return new Date(isoStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}
