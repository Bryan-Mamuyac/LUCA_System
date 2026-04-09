/* =====================
   LUCA SYSTEM — Main Script
   Includes: localStorage persistence, drafts, records, full ledger logic
   ===================== */

'use strict';

// ===================== STATE =====================

let transactions = [];
let transactionCounter = 1;

const totals = {
    cash: 0, accountsReceivable: 0, equipment: 0,
    inventory: 0, landBuilding: 0, intangible: 0,
    accountsPayable: 0, unearnedRevenue: 0,
    ownersCapital: 0, revenue: 0, expense: 0
};

// ===================== STORAGE =====================

const STORAGE_KEY  = 'luca_transactions';
const DRAFT_KEY    = 'luca_drafts';
const COUNTER_KEY  = 'luca_counter';
const RECORD_KEY   = 'luca_records';

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY,  JSON.stringify(transactions));
        localStorage.setItem(COUNTER_KEY,  transactionCounter.toString());
    } catch(e) { console.error('Storage save failed:', e); }
}

function loadFromStorage() {
    try {
        const saved   = localStorage.getItem(STORAGE_KEY);
        const counter = localStorage.getItem(COUNTER_KEY);
        if (saved)   transactions       = JSON.parse(saved);
        if (counter) transactionCounter = parseInt(counter, 10) || 1;
    } catch(e) { console.error('Storage load failed:', e); }
}

function loadDrafts() {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]'); }
    catch { return []; }
}
function saveDrafts(drafts) { localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts)); }

function loadRecords() {
    try { return JSON.parse(localStorage.getItem(RECORD_KEY) || '[]'); }
    catch { return []; }
}
function saveRecords(records) { localStorage.setItem(RECORD_KEY, JSON.stringify(records)); }

// ===================== TOAST =====================

function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast show ${type}`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.className = 'toast'; }, 3000);
}

// ===================== MODALS =====================

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('open'));
    if (id === 'draftsModal')  { renderDraftsList(); setTimeout(() => { const i = document.getElementById('draftSearchInput'); if(i) i.focus(); }, 350); }
    if (id === 'recordsModal') { renderRecordsList(); setTimeout(() => { const i = document.getElementById('recordSearchInput'); if(i) i.focus(); }, 350); }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('open');
    setTimeout(() => { modal.style.display = 'none'; }, 280);
}

window.addEventListener('click', e => {
    document.querySelectorAll('.modal.open').forEach(modal => {
        if (e.target === modal) closeModal(modal.id);
    });
});

function toggleMobileMenu() {
    const nav = document.querySelector('.nav-links');
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
    nav.style.flexDirection = 'column';
    nav.style.position = 'absolute';
    nav.style.top = '68px';
    nav.style.right = '16px';
    nav.style.background = '#fff';
    nav.style.padding = '12px';
    nav.style.borderRadius = '14px';
    nav.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
    nav.style.border = '1px solid #dde4f5';
    nav.style.zIndex = '300';
}

// ===================== ENTRY ROWS =====================

const ACCOUNT_OPTIONS = `
    <optgroup label="Assets">
        <option value="cash">Cash</option>
        <option value="accountsReceivable">Accounts Receivable</option>
        <option value="inventory">Inventory</option>
        <option value="equipment">Equipment</option>
        <option value="landBuilding">Land & Building</option>
        <option value="intangible">Intangible</option>
    </optgroup>
    <optgroup label="Liabilities">
        <option value="accountsPayable">Accounts Payable</option>
        <option value="unearnedRevenue">Unearned Revenue</option>
    </optgroup>
    <optgroup label="Owner's Equity">
        <option value="ownersCapital">Owner's Capital</option>
    </optgroup>
    <optgroup label="Profit & Loss">
        <option value="revenue">Revenue</option>
        <option value="expense">Expense</option>
    </optgroup>
`;

function buildEntryRowHTML(debitVal = '', creditVal = '', amount = '') {
    return `
        <div class="entry-row">
            <select class="account-select debit-account">
                <option value="">Select Account (Debit)</option>
                ${ACCOUNT_OPTIONS}
            </select>
            <select class="entry-type debit-type">
                <option value="debit" selected>+ Debit</option>
                <option value="credit">– Credit</option>
            </select>
            <input type="number" class="amount debit-amount amount-input" placeholder="0.00" step="0.01" min="0"${amount ? ` value="${amount}"` : ''}>
            <button class="remove-pair-btn" onclick="removeEntryPair(this)" title="Remove row">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div class="entry-row">
            <select class="account-select credit-account">
                <option value="">Select Account (Credit)</option>
                ${ACCOUNT_OPTIONS}
            </select>
            <select class="entry-type credit-type">
                <option value="debit">+ Debit</option>
                <option value="credit" selected>– Credit</option>
            </select>
            <input type="number" class="amount credit-amount amount-input" placeholder="0.00" step="0.01" min="0"${amount ? ` value="${amount}"` : ''}>
            <div style="width:34px"></div>
        </div>
    `;
}

function addEntryRow(debitAcc = '', creditAcc = '', amount = '', debitType = 'debit', creditType = 'credit') {
    const container = document.getElementById('entryRows');
    const pair = document.createElement('div');
    pair.className = 'entry-pair';
    const idx = container.children.length + 1;
    pair.innerHTML = `
        <div class="entry-pair-header">
            <span><i class="fa-solid fa-arrow-right-arrow-left" style="color:var(--primary)"></i> Entry Pair ${idx}</span>
        </div>
        ${buildEntryRowHTML(debitAcc, creditAcc, amount)}
    `;
    container.appendChild(pair);

    if (debitAcc)   pair.querySelector('.debit-account').value  = debitAcc;
    if (creditAcc)  pair.querySelector('.credit-account').value = creditAcc;
    if (debitType)  pair.querySelector('.debit-type').value     = debitType;
    if (creditType) pair.querySelector('.credit-type').value    = creditType;

    const amounts = pair.querySelectorAll('.amount');
    amounts.forEach(inp => {
        inp.addEventListener('input', () => {
            amounts.forEach(other => { if (other !== inp) other.value = inp.value; });
        });
    });
}

function removeEntryPair(btn) {
    const container = document.getElementById('entryRows');
    if (container.children.length <= 1) { showToast('At least one entry pair required', 'error'); return; }
    btn.closest('.entry-pair').remove();
    container.querySelectorAll('.entry-pair-header span').forEach((s, i) => {
        s.innerHTML = `<i class="fa-solid fa-arrow-right-arrow-left" style="color:var(--primary)"></i> Entry Pair ${i + 1}`;
    });
}

// ===================== VALIDATION & SUBMIT =====================

function showError(msg) {
    const el = document.getElementById('errorMessage');
    el.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${msg}`;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 4000);
}

function validateTransaction() {
    const date = document.getElementById('transactionDate').value;
    if (!date) { showError('Please select a date'); return null; }

    const entries = [];
    let valid = true;

    document.querySelectorAll('.entry-pair').forEach(pair => {
        pair.querySelectorAll('.entry-row').forEach(row => {
            const account = row.querySelector('.account-select').value;
            const type    = row.querySelector('.entry-type').value;
            const amount  = parseFloat(row.querySelector('.amount').value) || 0;
            if (!account || amount === 0) { valid = false; return; }
            entries.push({ account, type, amount });
        });
    });

    if (!valid || entries.length === 0) {
        showError('Please fill in all account entries with valid amounts');
        return null;
    }

    return { number: transactionCounter++, date, entries };
}

function submitTransaction() {
    const transaction = validateTransaction();
    if (!transaction) return;
    transactions.push(transaction);
    saveToStorage();
    updateTable();
    updateSummary();
    resetForm();
    showToast(`Transaction #${transaction.number} posted successfully`, 'success');
}

function resetForm() {
    document.getElementById('transactionDate').value = '';
    document.getElementById('entryRows').innerHTML = '';
    addEntryRow();
}

// ===================== TABLE RENDERING =====================

/*
 * DOUBLE-ENTRY ACCOUNTING RULES (Luca Pacioli, 1494)
 * ─────────────────────────────────────────────────
 * Account Type     │ Normal Balance │ Debit Effect │ Credit Effect
 * ─────────────────┼────────────────┼──────────────┼──────────────
 * Assets           │ Debit          │ ↑ Increase   │ ↓ Decrease
 * Liabilities      │ Credit         │ ↓ Decrease   │ ↑ Increase
 * Owner's Capital  │ Credit         │ ↓ Decrease   │ ↑ Increase
 * Revenue          │ Credit         │ ↓ Decrease   │ ↑ Increase
 * Expense          │ Debit          │ ↑ Increase   │ ↓ Decrease
 *
 * Accounting Equation:
 *   Assets = Liabilities + Equity
 *   Equity = Owner's Capital + Revenue − Expense
 *
 * In the ledger columns we store the NATURAL BALANCE effect:
 *   Assets & Expense : Debit = +, Credit = −
 *   Liabilities, Capital, Revenue: Credit = +, Debit = −
 */

// Which accounts have a CREDIT normal balance (increase on credit)
const CREDIT_NORMAL = new Set(['accountsPayable','unearnedRevenue','ownersCapital','revenue']);
// Which accounts have a DEBIT normal balance (increase on debit)
// assets: cash, accountsReceivable, inventory, equipment, landBuilding, intangible
// expense: expense

function accountEffect(account, type) {
    // Returns the signed multiplier for how this entry affects the account's balance
    // Credit-normal accounts: credit = +1, debit = -1
    // Debit-normal accounts:  debit = +1, credit = -1
    if (CREDIT_NORMAL.has(account)) {
        return type === 'credit' ? 1 : -1;
    } else {
        return type === 'debit' ? 1 : -1;
    }
}

function formatAmount(amount, isFirst, type) {
    const abs  = Math.abs(amount).toFixed(2);
    const sign = type === 'debit' ? '+' : '–';
    return isFirst ? `${sign}₱${abs}` : `${sign}${abs}`;
}

function updateTable() {
    const tbody = document.getElementById('ledgerBody');
    tbody.innerHTML = '';
    Object.keys(totals).forEach(k => totals[k] = 0);

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="13"><i class="fa-solid fa-inbox"></i> No transactions yet. Post your first transaction above.</td></tr>';
        updateTotalsDisplay();
        return;
    }

    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstEntry = {};
    Object.keys(totals).forEach(k => firstEntry[k] = true);

    transactions.forEach((tx, idx) => {
        const row = tbody.insertRow();

        const numCell = row.insertCell();
        numCell.textContent = tx.number;
        numCell.className = 'transaction-number';

        const dateCell = row.insertCell();
        dateCell.textContent = formatDate(tx.date);

        const cols = {};
        Object.keys(totals).forEach(k => { cols[k] = row.insertCell(); });

        tx.entries.forEach(entry => {
            const cell = cols[entry.account];
            if (!cell) return;

            // Apply correct accounting effect based on account type
            const effect = accountEffect(entry.account, entry.type);
            const signedAmount = entry.amount * effect;

            const isFirst = firstEntry[entry.account];
            cell.textContent = formatAmount(entry.amount, isFirst, entry.type);
            cell.className   = entry.type === 'debit' ? 'debit' : 'credit';

            // Accumulate using the NATURAL BALANCE effect
            totals[entry.account] += signedAmount;
            if (isFirst) firstEntry[entry.account] = false;
        });

        if (idx < transactions.length - 1) {
            const sep = tbody.insertRow();
            sep.className = 'entry-separator';
            const sepCell = sep.insertCell();
            sepCell.colSpan = 13;
        }
    });

    updateTotalsDisplay();
    updateSummary();
}

function formatDate(d) {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length !== 3) return d;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(parts[1],10)-1]} ${parseInt(parts[2],10)}, ${parts[0]}`;
}

function updateTotalsDisplay() {
    const keys = {
        cash: 'totalCash',
        accountsReceivable: 'totalAccountsReceivable',
        equipment: 'totalEquipment',
        inventory: 'totalInventory',
        landBuilding: 'totalLandBuilding',
        intangible: 'totalIntangible',
        accountsPayable: 'totalAccountsPayable',
        unearnedRevenue: 'totalUnearnedRevenue',
        ownersCapital: 'totalOwnersCapital',
        revenue: 'totalRevenue',
        expense: 'totalExpense',
    };
    Object.entries(keys).forEach(([key, elId]) => {
        const el = document.getElementById(elId);
        if (!el) return;
        const amount = totals[key];
        const sign   = amount >= 0 ? '+' : '–';
        el.textContent = `${sign}₱${Math.abs(amount).toFixed(2)}`;
        el.className   = amount >= 0 ? 'debit' : 'credit';
    });
}

// ===================== SUMMARY =====================

function fc(n) {
    const sign = n < 0 ? '–' : '';
    return `${sign}₱${Math.abs(n).toFixed(2)}`;
}

function updateSummary() {
    // Assets: sum of all asset account natural balances (debit-normal → positive = asset)
    const totalAssets = totals.cash + totals.accountsReceivable + totals.inventory
                      + totals.equipment + totals.landBuilding + totals.intangible;

    // Liabilities: sum of liability accounts (credit-normal → positive = owed)
    const totalLiabilities = totals.accountsPayable + totals.unearnedRevenue;

    // Equity = Owner's Capital + Revenue − Expense
    // (Revenue increases equity, Expense decreases equity)
    const totalEquity = totals.ownersCapital + totals.revenue - totals.expense;

    document.getElementById('totalAssets').textContent      = fc(totalAssets);
    document.getElementById('totalLiabilities').textContent = fc(totalLiabilities);
    document.getElementById('totalEquity').textContent      = fc(totalEquity);

    document.getElementById('summaryAssetCash').textContent         = fc(totals.cash);
    document.getElementById('summaryAssetAR').textContent           = fc(totals.accountsReceivable);
    document.getElementById('summaryAssetInventory').textContent    = fc(totals.inventory);
    document.getElementById('summaryAssetEquipment').textContent    = fc(totals.equipment);
    document.getElementById('summaryAssetLandBuilding').textContent = fc(totals.landBuilding);
    document.getElementById('summaryAssetIntangible').textContent   = fc(totals.intangible);

    document.getElementById('summaryLiabilityAP').textContent = fc(totals.accountsPayable);
    document.getElementById('summaryLiabilityUR').textContent = fc(totals.unearnedRevenue);

    document.getElementById('summaryEquityCapital').textContent = fc(totals.ownersCapital);
    document.getElementById('summaryEquityRevenue').textContent = fc(totals.revenue);
    document.getElementById('summaryEquityExpense').textContent = fc(totals.expense);

    checkBalance(totalAssets, totalLiabilities, totalEquity);
}

function checkBalance(assets, liabilities, equity) {
    const pill = document.getElementById('balanceStatus');
    const diff = Math.abs(assets - (liabilities + equity));
    if (diff < 0.01) {
        pill.className = 'balance-pill balanced';
        pill.innerHTML = `<i class="fa-solid fa-check-circle"></i> <span class="status">Balanced</span>`;
    } else {
        pill.className = 'balance-pill not-balanced';
        pill.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span class="status">Not Balanced (Diff: ₱${diff.toFixed(2)})</span>`;
    }
}

// ===================== DRAFTS =====================

function saveCurrentAsDraft() {
    const date    = document.getElementById('transactionDate').value;
    const entries = [];

    document.querySelectorAll('.entry-pair').forEach(pair => {
        pair.querySelectorAll('.entry-row').forEach(row => {
            const account = row.querySelector('.account-select').value;
            const type    = row.querySelector('.entry-type').value;
            const amount  = parseFloat(row.querySelector('.amount').value) || 0;
            if (account && amount > 0) entries.push({ account, type, amount });
        });
    });

    if (entries.length === 0) { showToast('Nothing to save — fill in at least one entry', 'error'); return; }

    const nameInput = document.getElementById('draftNameInput');
    const drafts    = loadDrafts();
    const name      = (nameInput && nameInput.value.trim()) || `Draft ${drafts.length + 1}`;

    const draft = {
        id:      Date.now(),
        name,
        savedAt: new Date().toLocaleString(),
        date:    date || null,
        entries,
    };
    drafts.push(draft);
    saveDrafts(drafts);
    updateDraftCount();
    if (nameInput) nameInput.value = '';
    renderDraftsList();
    showToast(`Saved as "${name}"`, 'success');
}

function loadDraft(id) {
    const drafts = loadDrafts();
    const draft  = drafts.find(d => d.id === id);
    if (!draft) return;

    document.getElementById('entryRows').innerHTML = '';
    if (draft.date) document.getElementById('transactionDate').value = draft.date;

    for (let i = 0; i < draft.entries.length; i += 2) {
        const de = draft.entries[i];
        const ce = draft.entries[i + 1] || { account: '', type: 'credit', amount: 0 };
        addEntryRow(de.account, ce.account, de.amount, de.type, ce.type);
    }

    closeModal('draftsModal');
    showToast(`Draft "${draft.name}" loaded`, 'info');
}

function deleteDraft(id) {
    let drafts = loadDrafts().filter(d => d.id !== id);
    saveDrafts(drafts);
    updateDraftCount();
    renderDraftsList();
    showToast('Draft deleted', 'info');
}

function clearAllDrafts() {
    if (!confirm('Clear all drafts? This cannot be undone.')) return;
    saveDrafts([]);
    updateDraftCount();
    renderDraftsList();
    showToast('All drafts cleared', 'info');
}

function renderDraftsList() {
    const q = ((document.getElementById('draftSearchInput') || {}).value || '').trim().toLowerCase();
    const drafts = loadDrafts();
    const filtered = q ? drafts.filter(d => d.name.toLowerCase().includes(q)) : drafts;
    renderDraftsToList(filtered, q);
}

function renderDraftsToList(drafts, query = '') {
    const list = document.getElementById('draftsList');
    if (!list) return;
    if (drafts.length === 0) {
        list.innerHTML = query
            ? `<div class="empty-drafts"><i class="fa-solid fa-magnifying-glass"></i><p>No drafts match "<strong>${escapeHtml(query)}</strong>"</p></div>`
            : '<div class="empty-drafts"><i class="fa-solid fa-inbox"></i><p>No saved drafts yet</p></div>';
        return;
    }
    list.innerHTML = [...drafts].reverse().map(d => `
        <div class="draft-item">
            <div class="draft-info">
                <h4><i class="fa-solid fa-file-lines" style="color:var(--primary);margin-right:6px"></i>${escapeHtml(d.name)}</h4>
                <p>${d.entries.length} entries · ${d.date ? formatDate(d.date) : 'No date'} · Saved ${d.savedAt}</p>
            </div>
            <div class="draft-btns">
                <button class="draft-load-btn" onclick="loadDraft(${d.id})"><i class="fa-solid fa-arrow-up-from-bracket"></i> Load</button>
                <button class="draft-del-btn" onclick="deleteDraft(${d.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function updateDraftCount() {
    const el = document.getElementById('draftCount');
    if (el) el.textContent = loadDrafts().length;
}

function filterDrafts(query) {
    const q = query.trim().toLowerCase();
    const drafts = loadDrafts();
    const filtered = q ? drafts.filter(d => d.name.toLowerCase().includes(q)) : drafts;
    renderDraftsToList(filtered, q);
}

function filterRecords(query) {
    const q = query.trim().toLowerCase();
    const records = loadRecords();
    const filtered = q ? records.filter(r => r.name.toLowerCase().includes(q)) : records;
    renderRecordsToList(filtered, q);
}

// ===================== RECORDS =====================

/**
 * Save the current full ledger state as a named record.
 * A record captures: all transactions, current totals snapshot,
 * the accounting equation figures, and balance status.
 */
function promptSaveRecord() {
    openModal('recordsModal');
    // Focus the name input after animation
    setTimeout(() => {
        const input = document.getElementById('recordNameInput');
        if (input) input.focus();
    }, 350);
}

function saveCurrentAsRecord() {
    if (transactions.length === 0) {
        showToast('No transactions to record — post some entries first', 'error');
        return;
    }

    const nameInput = document.getElementById('recordNameInput');
    const records   = loadRecords();
    const name      = (nameInput && nameInput.value.trim()) || `Record ${records.length + 1}`;

    const totalAssets      = totals.cash + totals.accountsReceivable + totals.inventory + totals.equipment + totals.landBuilding + totals.intangible;
    const totalLiabilities = totals.accountsPayable + totals.unearnedRevenue;
    const totalEquity      = totals.ownersCapital + totals.revenue + totals.expense;
    const isBalanced       = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    const record = {
        id:           Date.now(),
        name,
        savedAt:      new Date().toLocaleString(),
        txCount:      transactions.length,
        transactions: JSON.parse(JSON.stringify(transactions)),   // deep copy
        counter:      transactionCounter,
        totalsSnap: {
            assets:      totalAssets,
            liabilities: totalLiabilities,
            equity:      totalEquity,
        },
        isBalanced,
    };

    records.push(record);
    saveRecords(records);
    updateRecordCount();
    renderRecordsList();

    if (nameInput) nameInput.value = '';
    showToast(`Record "${name}" saved successfully`, 'success');
}

function restoreRecord(id) {
    const records = loadRecords();
    const record  = records.find(r => r.id === id);
    if (!record) return;

    if (!confirm(`Restore record "${record.name}"?\n\nThis will REPLACE your current ledger with the saved state. This cannot be undone.`)) return;

    transactions       = JSON.parse(JSON.stringify(record.transactions));
    transactionCounter = record.counter;
    saveToStorage();
    updateTable();
    updateSummary();
    closeModal('recordsModal');
    showToast(`Ledger restored from "${record.name}"`, 'success');
}

function deleteRecord(id) {
    let records = loadRecords().filter(r => r.id !== id);
    saveRecords(records);
    updateRecordCount();
    renderRecordsList();
    showToast('Record deleted', 'info');
}

function clearAllRecords() {
    if (!confirm('Clear all records? This cannot be undone.')) return;
    saveRecords([]);
    updateRecordCount();
    renderRecordsList();
    showToast('All records cleared', 'info');
}

function renderRecordsList() {
    const q = ((document.getElementById('recordSearchInput') || {}).value || '').trim().toLowerCase();
    const records = loadRecords();
    const filtered = q ? records.filter(r => r.name.toLowerCase().includes(q)) : records;
    renderRecordsToList(filtered, q);
}

function renderRecordsToList(records, query = '') {
    const list = document.getElementById('recordsList');
    if (!list) return;

    if (records.length === 0) {
        list.innerHTML = query
            ? `<div class="empty-drafts"><i class="fa-solid fa-magnifying-glass"></i><p>No records match "<strong>${escapeHtml(query)}</strong>"</p></div>`
            : '<div class="empty-drafts"><i class="fa-solid fa-book-open"></i><p>No records saved yet</p></div>';
        return;
    }

    list.innerHTML = [...records].reverse().map(r => `
        <div class="record-item">
            <div class="record-item-header">
                <div class="record-info">
                    <h4>
                        <i class="fa-solid fa-bookmark" style="color:var(--success)"></i>
                        ${escapeHtml(r.name)}
                    </h4>
                    <p>${r.txCount} transaction${r.txCount !== 1 ? 's' : ''} &nbsp;·&nbsp; Saved ${r.savedAt}</p>
                </div>
                <span class="record-balance-badge ${r.isBalanced ? 'ok' : 'bad'}">
                    <i class="fa-solid fa-${r.isBalanced ? 'check' : 'triangle-exclamation'}"></i>
                    ${r.isBalanced ? 'Balanced' : 'Not Balanced'}
                </span>
            </div>
            <div class="record-snapshot">
                <div class="record-snap-item snap-assets">
                    <span class="snap-label">Assets</span>
                    <span class="snap-value">₱${Math.abs(r.totalsSnap.assets).toFixed(2)}</span>
                </div>
                <div class="record-snap-item snap-liab">
                    <span class="snap-label">Liabilities</span>
                    <span class="snap-value">₱${Math.abs(r.totalsSnap.liabilities).toFixed(2)}</span>
                </div>
                <div class="record-snap-item snap-equity">
                    <span class="snap-label">Equity</span>
                    <span class="snap-value">₱${Math.abs(r.totalsSnap.equity).toFixed(2)}</span>
                </div>
            </div>
            <div class="record-btns">
                <button class="record-restore-btn" onclick="restoreRecord(${r.id})">
                    <i class="fa-solid fa-arrow-up-from-bracket"></i> Load
                </button>
                <button class="record-del-btn" onclick="deleteRecord(${r.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateRecordCount() {
    const el = document.getElementById('recordCount');
    if (el) el.textContent = loadRecords().length;
}

function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===================== CLEAR ALL =====================

function clearAllTransactions() {
    if (!confirm('Clear all posted transactions? This cannot be undone.')) return;
    transactions = [];
    transactionCounter = 1;
    saveToStorage();
    updateTable();
    updateSummary();
    showToast('All transactions cleared', 'info');
}

// ===================== CSV =====================

function exportToCSV() {
    if (transactions.length === 0) { showToast('No transactions to export', 'error'); return; }
    let csv = ['No.,Date,Cash,Accounts Receivable,Inventory,Equipment,Land & Building,Intangible,Accounts Payable,Unearned Revenue,Owner\'s Capital,Revenue,Expense\n'];

    transactions.forEach(tx => {
        const vals = { cash:0, accountsReceivable:0, inventory:0, equipment:0, landBuilding:0, intangible:0, accountsPayable:0, unearnedRevenue:0, ownersCapital:0, revenue:0, expense:0 };
        tx.entries.forEach(e => { vals[e.account] = e.type === 'debit' ? e.amount : -e.amount; });
        csv.push([tx.number, tx.date, ...Object.values(vals)].join(',') + '\n');
    });

    const totRow = ['Totals', '', totals.cash, totals.accountsReceivable, totals.inventory, totals.equipment, totals.landBuilding, totals.intangible, totals.accountsPayable, totals.unearnedRevenue, totals.ownersCapital, totals.revenue, totals.expense];
    csv.push('\n' + totRow.join(','));

    const blob = new Blob([csv.join('')], { type: 'text/csv;charset=utf-8;' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `luca_ledger_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    showToast('CSV exported successfully', 'success');
}

function triggerFileInput() {
    const inp    = document.createElement('input');
    inp.type     = 'file';
    inp.accept   = '.csv';
    inp.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try { importFromCSV(ev.target.result); }
            catch(err) { showToast('Error importing CSV file', 'error'); }
        };
        reader.readAsText(file);
    };
    inp.click();
}

function importFromCSV(csvData) {
    transactions       = [];
    transactionCounter = 1;

    const lines     = csvData.split('\n');
    const dataLines = lines.slice(1, -2);
    const accounts  = ['cash','accountsReceivable','inventory','equipment','landBuilding','intangible','accountsPayable','unearnedRevenue','ownersCapital','revenue','expense'];

    dataLines.forEach(line => {
        if (!line.trim()) return;
        const [number, date, ...amounts] = line.split(',');
        const entries = [];
        amounts.forEach((amt, i) => {
            const val = parseFloat(amt);
            if (val !== 0 && accounts[i]) {
                entries.push({ account: accounts[i], type: val > 0 ? 'debit' : 'credit', amount: Math.abs(val) });
            }
        });
        if (entries.length > 0) {
            transactions.push({ number: parseInt(number, 10), date, entries });
            transactionCounter = Math.max(transactionCounter, parseInt(number, 10) + 1);
        }
    });

    saveToStorage();
    updateTable();
    updateSummary();
    showToast(`Imported ${transactions.length} transactions`, 'success');
}

// ===================== INIT =====================

document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    addEntryRow();
    updateTable();
    updateSummary();
    updateDraftCount();
    updateRecordCount();

    const dateInput = document.getElementById('transactionDate');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().slice(0, 10);
    }
});