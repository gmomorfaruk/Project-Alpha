/**
 * Financial Tracker - Centralized calculation for all money flow
 * File: js/financial-tracker.js
 * 
 * This file handles ALL financial calculations:
 * - Admin Investments (money admin puts in)
 * - User Deposits (money users add)
 * - Membership Purchases (income from memberships)
 * - Product Sales (income from products)
 * - User Earnings (money we give to users - daily tasks, referrals)
 * - Withdrawals (money users take out)
 * - Daily/Weekly/Monthly summaries
 */

const FinancialTracker = {
    
    // Get today's date key
    getDateKey(date = new Date()) {
        return date.toISOString().split('T')[0];
    },
    
    // ==================== ADMIN INVESTMENTS ====================
    
    // Add admin investment
    addAdminInvestment(amount, description = '') {
        const investments = this.getAdminInvestments();
        const entry = {
            id: Date.now(),
            amount: parseFloat(amount),
            description: description,
            date: new Date().toISOString(),
            dateKey: this.getDateKey()
        };
        investments.push(entry);
        localStorage.setItem('adminInvestments', JSON.stringify(investments));
        this.updateDailySummary();
        return entry;
    },
    
    // Get all admin investments
    getAdminInvestments() {
        return JSON.parse(localStorage.getItem('adminInvestments') || '[]');
    },
    
    // Get total admin investment
    getTotalAdminInvestment() {
        return this.getAdminInvestments().reduce((sum, inv) => sum + inv.amount, 0);
    },
    
    // ==================== INCOME TRACKING ====================
    
    // Record membership purchase
    recordMembershipPurchase(userId, membershipType, amount) {
        const records = this.getMembershipRecords();
        const entry = {
            id: Date.now(),
            userId: userId,
            membershipType: membershipType,
            amount: parseFloat(amount),
            date: new Date().toISOString(),
            dateKey: this.getDateKey()
        };
        records.push(entry);
        localStorage.setItem('membershipRecords', JSON.stringify(records));
        this.updateDailySummary();
        return entry;
    },
    
    getMembershipRecords() {
        return JSON.parse(localStorage.getItem('membershipRecords') || '[]');
    },
    
    // Record product sale
    recordProductSale(userId, productId, productName, amount) {
        const records = this.getProductSaleRecords();
        const entry = {
            id: Date.now(),
            userId: userId,
            productId: productId,
            productName: productName,
            amount: parseFloat(amount),
            date: new Date().toISOString(),
            dateKey: this.getDateKey()
        };
        records.push(entry);
        localStorage.setItem('productSaleRecords', JSON.stringify(records));
        this.updateDailySummary();
        return entry;
    },
    
    getProductSaleRecords() {
        return JSON.parse(localStorage.getItem('productSaleRecords') || '[]');
    },
    
    // Record user deposit
    recordDeposit(userId, amount, method) {
        const records = this.getDepositRecords();
        const entry = {
            id: Date.now(),
            userId: userId,
            amount: parseFloat(amount),
            method: method,
            date: new Date().toISOString(),
            dateKey: this.getDateKey()
        };
        records.push(entry);
        localStorage.setItem('depositRecords', JSON.stringify(records));
        this.updateDailySummary();
        return entry;
    },
    
    getDepositRecords() {
        return JSON.parse(localStorage.getItem('depositRecords') || '[]');
    },
    
    // ==================== EXPENSE TRACKING ====================
    
    // Record user earnings (daily task earnings, referral bonus, etc)
    recordUserEarning(userId, amount, type, description = '') {
        const records = this.getUserEarningRecords();
        const entry = {
            id: Date.now(),
            userId: userId,
            amount: parseFloat(amount),
            type: type, // 'task', 'referral', 'bonus', 'daily'
            description: description,
            date: new Date().toISOString(),
            dateKey: this.getDateKey()
        };
        records.push(entry);
        localStorage.setItem('userEarningRecords', JSON.stringify(records));
        this.updateDailySummary();
        return entry;
    },
    
    getUserEarningRecords() {
        return JSON.parse(localStorage.getItem('userEarningRecords') || '[]');
    },
    
    // Record withdrawal
    recordWithdrawal(userId, amount, method) {
        const records = this.getWithdrawalRecords();
        const entry = {
            id: Date.now(),
            userId: userId,
            amount: parseFloat(amount),
            method: method,
            date: new Date().toISOString(),
            dateKey: this.getDateKey()
        };
        records.push(entry);
        localStorage.setItem('withdrawalRecords', JSON.stringify(records));
        this.updateDailySummary();
        return entry;
    },
    
    getWithdrawalRecords() {
        return JSON.parse(localStorage.getItem('withdrawalRecords') || '[]');
    },
    
    // ==================== DAILY SUMMARY ====================
    
    updateDailySummary() {
        const dateKey = this.getDateKey();
        const summaries = this.getAllDailySummaries();
        
        // Calculate today's figures
        const todayInvestments = this.getAdminInvestments().filter(r => r.dateKey === dateKey);
        const todayMemberships = this.getMembershipRecords().filter(r => r.dateKey === dateKey);
        const todayProducts = this.getProductSaleRecords().filter(r => r.dateKey === dateKey);
        const todayDeposits = this.getDepositRecords().filter(r => r.dateKey === dateKey);
        const todayEarnings = this.getUserEarningRecords().filter(r => r.dateKey === dateKey);
        const todayWithdrawals = this.getWithdrawalRecords().filter(r => r.dateKey === dateKey);
        
        const adminInvestment = todayInvestments.reduce((sum, r) => sum + r.amount, 0);
        const membershipIncome = todayMemberships.reduce((sum, r) => sum + r.amount, 0);
        const productIncome = todayProducts.reduce((sum, r) => sum + r.amount, 0);
        const depositIncome = todayDeposits.reduce((sum, r) => sum + r.amount, 0);
        const userEarnings = todayEarnings.reduce((sum, r) => sum + r.amount, 0);
        const withdrawals = todayWithdrawals.reduce((sum, r) => sum + r.amount, 0);
        
        const totalIncome = membershipIncome + productIncome + depositIncome;
        const totalExpense = userEarnings + withdrawals;
        const netProfit = totalIncome - totalExpense;
        
        summaries[dateKey] = {
            date: dateKey,
            adminInvestment: adminInvestment,
            membershipIncome: membershipIncome,
            productIncome: productIncome,
            depositIncome: depositIncome,
            totalIncome: totalIncome,
            userEarnings: userEarnings,
            withdrawals: withdrawals,
            totalExpense: totalExpense,
            netProfit: netProfit,
            updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('dailySummaries', JSON.stringify(summaries));
        return summaries[dateKey];
    },
    
    getAllDailySummaries() {
        return JSON.parse(localStorage.getItem('dailySummaries') || '{}');
    },
    
    getDailySummary(dateKey = null) {
        if (!dateKey) dateKey = this.getDateKey();
        const summaries = this.getAllDailySummaries();
        return summaries[dateKey] || {
            date: dateKey,
            adminInvestment: 0,
            membershipIncome: 0,
            productIncome: 0,
            depositIncome: 0,
            totalIncome: 0,
            userEarnings: 0,
            withdrawals: 0,
            totalExpense: 0,
            netProfit: 0
        };
    },
    
    // ==================== REPORTS ====================
    
    // Get summary for date range
    getRangeSummary(startDate, endDate) {
        const summaries = this.getAllDailySummaries();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        let result = {
            adminInvestment: 0,
            membershipIncome: 0,
            productIncome: 0,
            depositIncome: 0,
            totalIncome: 0,
            userEarnings: 0,
            withdrawals: 0,
            totalExpense: 0,
            netProfit: 0,
            days: []
        };
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = this.getDateKey(d);
            const day = summaries[key];
            if (day) {
                result.adminInvestment += day.adminInvestment || 0;
                result.membershipIncome += day.membershipIncome || 0;
                result.productIncome += day.productIncome || 0;
                result.depositIncome += day.depositIncome || 0;
                result.totalIncome += day.totalIncome || 0;
                result.userEarnings += day.userEarnings || 0;
                result.withdrawals += day.withdrawals || 0;
                result.totalExpense += day.totalExpense || 0;
                result.netProfit += day.netProfit || 0;
                result.days.push(day);
            }
        }
        
        return result;
    },
    
    // Get last N days summary
    getLastNDaysSummary(days = 7) {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days + 1);
        return this.getRangeSummary(start, end);
    },
    
    // Get this month summary
    getThisMonthSummary() {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return this.getRangeSummary(start, now);
    },
    
    // Get overall totals
    getOverallTotals() {
        const adminInvestments = this.getTotalAdminInvestment();
        const memberships = this.getMembershipRecords().reduce((sum, r) => sum + r.amount, 0);
        const products = this.getProductSaleRecords().reduce((sum, r) => sum + r.amount, 0);
        const deposits = this.getDepositRecords().reduce((sum, r) => sum + r.amount, 0);
        const earnings = this.getUserEarningRecords().reduce((sum, r) => sum + r.amount, 0);
        const withdrawals = this.getWithdrawalRecords().reduce((sum, r) => sum + r.amount, 0);
        
        const totalIncome = memberships + products + deposits;
        const totalExpense = earnings + withdrawals;
        const netProfit = totalIncome - totalExpense;
        const currentBalance = adminInvestments + netProfit;
        
        return {
            adminInvestments: adminInvestments,
            membershipIncome: memberships,
            productIncome: products,
            depositIncome: deposits,
            totalIncome: totalIncome,
            userEarnings: earnings,
            withdrawals: withdrawals,
            totalExpense: totalExpense,
            netProfit: netProfit,
            currentBalance: currentBalance
        };
    },
    
    // Format currency
    formatCurrency(amount) {
        return '৳' + parseFloat(amount || 0).toLocaleString('en-IN');
    }
};

// Make it globally available
window.FinancialTracker = FinancialTracker;
