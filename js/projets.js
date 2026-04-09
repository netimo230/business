// js/projets.js
import { db, ref, set, get, push, remove, onValue } from './firebase.js';
import { openModal, closeModal, showToast } from './app.js';

const projectsRef = ref(db, 'projects');
let projects = {};
let currentProjectId = null;

const ICONS = ['◈','⬡','◉','△','⬟','◇','⊙','❖','✦','⬤'];
const randomIcon = () => ICONS[Math.floor(Math.random() * ICONS.length)];

// ===== LISTEN =====
onValue(projectsRef, snap => {
  projects = snap.val() || {};
  if (currentProjectId) renderProjectDetail(currentProjectId);
  else renderProjectGrid();
});

// ===== ADD PROJECT =====
document.getElementById('btn-add-project').addEventListener('click', () => {
  openModal('Nouveau projet', `
    <input type="text" id="new-project-name" placeholder="Nom du projet..." />
    <button class="btn-primary full-width" id="confirm-add-project" style="margin-top:8px">Créer</button>
  `);
  setTimeout(() => {
    document.getElementById('new-project-name').focus();
    document.getElementById('confirm-add-project').addEventListener('click', () => {
      const name = document.getElementById('new-project-name').value.trim();
      if (!name) return;
      const newRef = push(projectsRef);
      set(newRef, { name, icon: randomIcon(), contents: {} });
      closeModal();
      showToast('✓ Projet créé');
    });
    document.getElementById('new-project-name').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('confirm-add-project').click();
    });
  }, 50);
});

// ===== GRID =====
function renderProjectGrid() {
  const grid = document.getElementById('project-grid');
  const detail = document.getElementById('project-detail');
  grid.classList.remove('hidden');
  detail.classList.add('hidden');
  grid.innerHTML = '';

  if (Object.keys(projects).length === 0) {
    grid.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:20px">Aucun projet. Créez-en un !</div>';
    return;
  }

  Object.entries(projects).forEach(([id, proj]) => {
    const count = proj.contents ? Object.keys(proj.contents).length : 0;
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <div class="project-card-icon">${proj.icon || '◈'}</div>
      <div class="project-card-name">${escHtml(proj.name)}</div>
      <div class="project-card-count">${count} élément${count > 1 ? 's' : ''}</div>
    `;
    card.addEventListener('click', () => openProject(id));
    grid.appendChild(card);
  });
}

// ===== DETAIL =====
function openProject(id) {
  currentProjectId = id;
  renderProjectDetail(id);
}

function renderProjectDetail(id) {
  const proj = projects[id];
  if (!proj) { renderProjectGrid(); return; }

  const grid = document.getElementById('project-grid');
  const detail = document.getElementById('project-detail');
  grid.classList.add('hidden');
  detail.classList.remove('hidden');

  document.getElementById('project-detail-title').textContent = `${proj.icon || '◈'} ${proj.name}`;

  const contentList = document.getElementById('project-content-list');
  contentList.innerHTML = '';

  const contents = proj.contents || {};
  if (Object.keys(contents).length === 0) {
    contentList.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px">Aucun contenu. Ajoutez du texte ou un fichier.</div>';
  } else {
    Object.entries(contents).forEach(([cid, item]) => {
      const div = document.createElement('div');
      div.className = 'content-item';
      div.innerHTML = `
        <div class="content-icon">${getIcon(item.type)}</div>
        <div class="content-body">
          ${renderContent(item)}
          <div class="content-meta">${item.type === 'text' ? 'Texte' : 'Fichier'} · ${new Date(item.date).toLocaleDateString('fr-FR')}</div>
        </div>
        <button class="content-delete" data-cid="${cid}" title="Supprimer">✕</button>
      `;
      contentList.appendChild(div);
    });
    contentList.querySelectorAll('.content-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteContent(id, btn.dataset.cid));
    });
  }
}

function getIcon(type) {
  if (type === 'text') return '📝';
  if (type === 'image') return '🖼️';
  if (type === 'video') return '🎬';
  if (type === 'pdf') return '📄';
  return '📎';
}

function renderContent(item) {
  if (item.type === 'text') return `<div>${escHtml(item.value)}</div>`;
  if (item.type === 'image') return `<img src="${item.value}" style="max-width:100%;max-height:200px;border-radius:8px;margin-top:6px" />`;
  if (item.type === 'video') return `<video src="${item.value}" controls style="max-width:100%;border-radius:8px;margin-top:6px"></video>`;
  return `<a href="${item.value}" target="_blank" style="color:var(--accent2)">${escHtml(item.name || 'Fichier')}</a>`;
}

// ===== BACK =====
document.getElementById('btn-back-project').addEventListener('click', () => {
  currentProjectId = null;
  renderProjectGrid();
});

// ===== DELETE PROJECT =====
document.getElementById('btn-delete-project').addEventListener('click', () => {
  if (!currentProjectId) return;
  const proj = projects[currentProjectId];
  if (!confirm(`Supprimer le projet "${proj?.name}" ?`)) return;
  remove(ref(db, `projects/${currentProjectId}`));
  currentProjectId = null;
  showToast('Projet supprimé');
});

// ===== ADD TEXT =====
document.getElementById('btn-add-text').addEventListener('click', () => {
  const val = document.getElementById('content-text-input').value.trim();
  if (!val || !currentProjectId) return;
  addContent(currentProjectId, { type: 'text', value: val, date: new Date().toISOString() });
  document.getElementById('content-text-input').value = '';
});
document.getElementById('content-text-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-add-text').click();
});

// ===== ADD FILE =====
document.getElementById('content-file-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file || !currentProjectId) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const type = getFileType(file.type);
    addContent(currentProjectId, {
      type,
      value: ev.target.result,
      name: file.name,
      date: new Date().toISOString()
    });
    showToast('✓ Fichier ajouté');
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

function getFileType(mime) {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime === 'application/pdf') return 'pdf';
  return 'file';
}

function addContent(projectId, item) {
  const newRef = push(ref(db, `projects/${projectId}/contents`));
  set(newRef, item);
  showToast('✓ Contenu ajouté');
}

function deleteContent(projectId, contentId) {
  remove(ref(db, `projects/${projectId}/contents/${contentId}`));
  showToast('Contenu supprimé');
}

// ===== UTILS =====
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
