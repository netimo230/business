// js/depenses.js
import { db, ref, set, get, push, remove, onValue } from './firebase.js';
import { showToast } from './app.js';

const walletRef = ref(db, 'wallet');
let wallet = null;

// ===== LISTEN =====
onValue(walletRef, snap => {
  wallet = snap.val();
  renderWallet();
});

// ===== INIT WALLET =====
document.getElementById('btn-init-wallet').addEventListener('click', () => {
  const val = parseFloat(document.getElementById('initial-budget-input').value);
  if (isNaN(val) || val < 0) { showToast('Montant invalide'); return; }
  set(walletRef, {
    initial: val,
    current: val,
    transactions: {}
  });
  showToast('✓ Portefeuille créé');
});

// ===== ADD TRANSACTION =====
document.getElementById('btn-add-tx').addEventListener('click', () => {
  if (!wallet) { showToast('Créez d\'abord le portefeuille'); return; }
  const label = document.getElementById('tx-label').value.trim() || 'Transaction';
  const amount = parseFloat(document.getElementById('tx-amount').value);
  if (isNaN(amount) || amount <= 0) { showToast('Montant invalide'); return; }
  const type = document.querySelector('input[name="tx-type"]:checked').value;

  const sign = type === 'add' ? 1 : -1;
  const newCurrent = Math.round((wallet.current + sign * amount) * 100) / 100;

  const txRef = push(ref(db, 'wallet/transactions'));
  set(txRef, {
    label,
    amount: sign * amount,
    date: new Date().toISOString()
  });
  set(ref(db, 'wallet/current'), newCurrent);

  document.getElementById('tx-label').value = '';
  document.getElementById('tx-amount').value = '';
  showToast(`${type === 'add' ? '+' : '-'}${amount.toFixed(2)} € enregistré`);
});

// ===== RENDER =====
function renderWallet() {
  const setup = document.getElementById('wallet-setup');
  const dash = document.getElementById('wallet-dashboard');

  if (!wallet) {
    setup.classList.remove('hidden');
    dash.classList.add('hidden');
    return;
  }

  setup.classList.add('hidden');
  dash.classList.remove('hidden');

  const initial = wallet.initial || 0;
  const current = wallet.current ?? initial;
  const profit = Math.round((current - initial) * 100) / 100;

  document.getElementById('stat-initial').textContent = fmt(initial);
  document.getElementById('stat-current').textContent = fmt(current);

  const profitEl = document.getElementById('stat-profit');
  const profitCard = document.getElementById('stat-profit-card');
  profitEl.textContent = (profit >= 0 ? '+' : '') + fmt(profit);
  profitCard.className = `stat-card ${profit >= 0 ? 'profit-pos' : 'profit-neg'}`;

  // Transactions list
  const txList = document.getElementById('tx-list');
  txList.innerHTML = '';
  const txs = wallet.transactions || {};
  const sorted = Object.entries(txs).sort((a,b) => new Date(b[1].date) - new Date(a[1].date));

  if (sorted.length === 0) {
    txList.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px">Aucune transaction</div>';
    return;
  }

  sorted.forEach(([id, tx]) => {
    const isPos = tx.amount >= 0;
    const div = document.createElement('div');
    div.className = 'tx-item';
    div.innerHTML = `
      <div>
        <div class="tx-label">${escHtml(tx.label)}</div>
        <div class="tx-date">${new Date(tx.date).toLocaleString('fr-FR', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</div>
      </div>
      <div class="tx-amount ${isPos ? 'pos' : 'neg'}">${isPos ? '+' : ''}${fmt(tx.amount)}</div>
    `;
    txList.appendChild(div);
  });
}

function fmt(n) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
