// Expense Manges – Frontend Logic (LocalStorage-based)

class ExpenseManges {
    constructor() {
        this.budget = parseFloat(localStorage.getItem('monthlyBudget')) || 0;
        this.expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    init() {
        this.cacheDom();
        this.bindEvents();
        this.setDefaultDate();
        this.renderAll();
    }

    cacheDom() {
        // Budget
        this.budgetInput   = document.getElementById('monthly-budget');
        this.setBudgetBtn  = document.getElementById('set-budget-btn');
        this.budgetDisplay = document.getElementById('monthly-budget-display');
        this.dailyTargetEl = document.getElementById('daily-target');
        // Summary
        this.totalSpentEl      = document.getElementById('total-spent');
        this.avgDailySpendEl   = document.getElementById('avg-daily-spend');
        this.remainingMoneyEl  = document.getElementById('remaining-money');
        this.daysLeftEl        = document.getElementById('days-left');
        this.overBudgetDaysEl  = document.getElementById('over-budget-days');
        this.highestSpendEl    = document.getElementById('highest-spend');
        // Expense Form
        this.form         = document.getElementById('expense-form');
        this.descInput    = document.getElementById('expense-description');
        this.amountInput  = document.getElementById('expense-amount');
        this.catInput     = document.getElementById('expense-category');
        this.dateInput    = document.getElementById('expense-date');
        // Expense List
        this.listContainer = document.getElementById('expense-list');
        this.noExpensesEl  = document.getElementById('no-expenses-message');
        this.catFilter     = document.getElementById('filter-category');
        this.clearAllBtn   = document.getElementById('clear-all-btn');
        // Quick Stats
        this.todayEl      = document.getElementById('today-spending');
        this.weekEl       = document.getElementById('week-spending');
        this.percentEl    = document.getElementById('budget-percentage');
        this.daysRemainEl = document.getElementById('days-remaining');
        // Notifications
        this.notifContainer = document.getElementById('notification-container');
    }

    bindEvents() {
        this.setBudgetBtn.addEventListener('click', () => this.setBudget());
        this.form.addEventListener('submit', e => {
            e.preventDefault();
            this.addExpense();
        });
        this.catFilter.addEventListener('change', () => this.renderList());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());
        this.listContainer.addEventListener('click', e => {
            if (e.target.classList.contains('delete-btn')) {
                this.deleteExpense(parseInt(e.target.dataset.id, 10));
            }
        });
    }

    setDefaultDate() {
        this.dateInput.value = new Date().toISOString().split('T')[0];
    }

    setBudget() {
        const val = parseFloat(this.budgetInput.value);
        if (!val || val <= 0) {
            return this.notify('Enter a valid budget', 'error');
        }
        this.budget = val;
        localStorage.setItem('monthlyBudget', val);
        this.notify('Monthly budget set', 'success');
        this.renderAll();
        this.clearAll();
    }

    addExpense() {
        const desc = this.descInput.value.trim();
        const amt  = parseFloat(this.amountInput.value);
        const cat  = this.catInput.value;
        const date = this.dateInput.value;
        if (!desc || !amt || !cat || !date) {
            return this.notify('Fill all fields', 'error');
        }
        if (amt <= 0) {
            return this.notify('Amount must be > 0', 'error');
        }
        const expense = { id: Date.now(), desc, amt, cat, date };
        this.expenses.unshift(expense);
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
        this.form.reset();
        this.setDefaultDate();
        this.notify('Expense added', 'success');
        this.renderAll();
    }

    deleteExpense(id) {
        if (!confirm('Delete this expense?')) return;
        this.expenses = this.expenses.filter(e => e.id !== id);
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
        this.notify('Expense deleted', 'success');
        this.renderAll();
    }

    clearAll() {
        if (!confirm('Erase all expenses?')) return;
        this.expenses = [];
        localStorage.setItem('expenses', '[]');
        this.notify('All expenses cleared', 'success');
        this.renderAll();
        localStorage.setItem('monthlyBudget', 0);
    }

    renderAll() {
        this.renderSummary();
        this.renderList();
        this.renderQuickStats();
    }

    renderSummary() {
        const now = new Date(), ym = now.toISOString().slice(0,7);
        const monthExp = this.expenses.filter(e => e.date.startsWith(ym));
        const total = monthExp.reduce((s,e)=>s+e.amt,0);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1,0).getDate();
        const today = now.getDate();
        const dailyBudget = this.budget / daysInMonth || 0;
        const avgDaily = total / today || 0;
        const remain = this.budget - total;
        // Over-budget days & highest spend
        const dailyTotals = {};
        monthExp.forEach(e => { dailyTotals[e.date] = (dailyTotals[e.date]||0)+e.amt; });
        const overDays = Object.values(dailyTotals).filter(v=>v>dailyBudget).length;
        const highest = Math.max(0, ...Object.values(dailyTotals));
        // Update DOM
        this.budgetDisplay.textContent = `₹${totalFixed(this.budget)}`;
        this.dailyTargetEl.textContent = `₹${totalFixed(dailyBudget)}`;
        this.totalSpentEl.textContent = `₹${totalFixed(total)}`;
        this.avgDailySpendEl.textContent = `₹${totalFixed(avgDaily)}`;
        this.remainingMoneyEl.textContent = `₹${totalFixed(remain)}`;
        this.daysLeftEl.textContent = daysInMonth - today;
        this.overBudgetDaysEl.textContent = overDays;
        this.highestSpendEl.textContent = `₹${totalFixed(highest)}`;
        this.budgetInput.value = this.budget || '';
    }

    renderList() {
        const cat = this.catFilter.value;
        const filtered = cat ? this.expenses.filter(e=>e.cat===cat) : this.expenses;
        this.listContainer.innerHTML = '';
        if (!filtered.length) {
            return this.listContainer.appendChild(this.noExpensesEl);
        }
        filtered.forEach(e => {
            const div = document.createElement('div');
            div.className = 'expense-item';
            div.innerHTML = `
                <button class="delete-btn" data-id="${e.id}">&times;</button>
                <div class="expense-header">
                    <div><strong>${escapeHtml(e.desc)}</strong></div>
                    <div class="expense-amount">₹${totalFixed(e.amt)}</div>
                </div>
                <div class="expense-details">
                    <span>${e.cat}</span>
                    <span>${formatDate(e.date)}</span>
                </div>
            `;
            this.listContainer.appendChild(div);
        });
    }

    renderQuickStats() {
        const now = new Date(), ym = now.toISOString().slice(0,7);
        const today = now.toISOString().slice(0,10);
        const weekStart = (() => {
            const d=new Date(), diff=d.getDate()-d.getDay();
            return new Date(d.setDate(diff)).toISOString().slice(0,10);
        })();
        const monthStart = `${ym}-01`;
        const sumRange = (start,end) => this.expenses
            .filter(e=>e.date>=start&&e.date<=end)
            .reduce((s,e)=>s+e.amt,0);
        const spentToday = sumRange(today, today);
        const spentWeek  = sumRange(weekStart, today);
        const totalSpent = this.expenses.reduce((s,e)=>s+e.amt,0);
        const percent    = this.budget ? (totalSpent/this.budget*100) : 0;
        const daysInMonth= new Date(now.getFullYear(), now.getMonth()+1,0).getDate();
        const daysLeft   = daysInMonth - now.getDate();
        this.todayEl.textContent      = `₹${totalFixed(spentToday)}`;
        this.weekEl.textContent       = `₹${totalFixed(spentWeek)}`;
        this.percentEl.textContent    = `${percent.toFixed(1)}%`;
        this.daysRemainEl.textContent = daysLeft;
    }

    notify(msg, type='info') {
        const div = document.createElement('div');
        div.className = `notification ${type}`;
        div.textContent = msg;
        this.notifContainer.appendChild(div);
        setTimeout(()=> div.remove(), 2500);
    }
}

// Helpers
function totalFixed(n){ return n.toFixed(2); }
function formatDate(d){ return new Date(d).toLocaleDateString('en-IN',{year:'numeric',month:'short',day:'numeric'}); }
function escapeHtml(t){ const div=document.createElement('div'); div.textContent=t; return div.innerHTML; }

// Initialize
new ExpenseManges();
