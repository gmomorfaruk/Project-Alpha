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
 * 
 * NOW USES Storage wrapper for auto-sync with cloud database!
 */

// Helper to get Storage (fallback to localStorage if not available)
function getStorage() {
    if (window.Storage && typeof window.Storage.get === 'function') {
        return window.Storage;
    }
    // Fallback for when main.js hasn't loaded yet
    return {
        get(key) {
            const item = localStorage.getItem('projectAlpha_' + key);
            return item ? JSON.parse(item) : null;
        },
        set(key, value) {
            localStorage.setItem('projectAlpha_' + key, JSON.stringify(value));
            return true;
        }
    };
}

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
            id: Date.now().toString(),
            amount: parseFloat(amount),
            description: description,
            date: new Date().toISOString(),
            dateKey: this.getDateKey()
        };
        investments.push(entry);
        getStorage().set('adminInvestments', investments);
        this.updateDailySummary();
        return entry;
    },
    
    // Get all admin investments
    getAdminInvestments() {
        return getStorage().get('adminInvestments') || [];
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
            id: Date.now().toString(),
            userId: userId,
            membershipType: membershipType,
            amount: parseFloat(amount),
            date: new Date().toISOString(),
            dateKey: this.getDateKey()
        };
        records.push(entry);
        getStorage().set('membershipRecords', records);
        this.updateDailySummary();
        return entry;
    },
    
    getMembershipRecords() {
        return getStorage().get('membershipRecords') || [];
    },
    
    // Record product sale
    recordProductSale(userId, productId, productName, amount) {
        const records = this.getProductSaleRecords();
        const entry = {
            id: Date.now().toString(),
            userId: userId,
            productId: productId,
            productName: productName,
            amount: parseFloat(amount),
            date: new Date().toISOString(),
            dateKey: this.getDateKey()
        };
        records.push(entry);
        getStorage().set('productSaleRecords', records);
        this.updateDailySummary();
        return entry;
    },
    
    getProductSaleRecords() {
        return getStorage().get('productSaleRecords') || [];
    },
    
    // Record user deposit
    recordDeposit(userId, amount, method) {
        const records = this.getDepositRecords();
        const entry = {
            id: Date.now().toString(),
            userId: userId,
            amount: parseFloat(amount),
            method: method,
            date: new Date().toISOString(),
            dateKey: this.getDateKey()
        };
        records.push(entry);
        getStorage().set('depositRecords', records);
        this.updateDailySummary();
        return entry;
    },
    
    getDepositRecords() {
        return getStorage().get('depositRecords') || [];
    },
    
    // ==================== EXPENSE TRACKING ====================
    
    // Record user earnings (daily task earnings, referral bonus, etc)
    recordUserEarning(userId, amount, type, description = '') {
        const records = this.getUserEarningRecords();
        const entry = {
            id: Date.now().toString(),
            userId: userId,
            amount: parseFloat(amount),
            type: type, // 'task', 'referral', 'bonus', 'daily'
            description: description,
            date: new Date().toISOString(),
            dateKey: this.getDateKey()
        };
        records.push(entry);
        getStorage().set('userEarningRecords', records);
        this.updateDailySummary();
        return entry;
    },
    
    getUserEarningRecords() {
        return getStorage().get('userEarningRecords') || [];
    },
    
    // Record withdrawal
    recordWithdrawal(userId, amount, method) {
        const records = this.getWithdrawalRecords();
        const entry = {
            id: Date.now().toString(),
            userId: userId,
            amount: parseFloat(amount),
            method: method,
            date: new Date().toISOString(),
            dateKey: this.getDateKey()
        };
        records.push(entry);
        getStorage().set('withdrawalRecords', records);
        this.updateDailySummary();
        return entry;
    },
    
    getWithdrawalRecords() {
        return getStorage().get('withdrawalRecords') || [];
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
        
        getStorage().set('dailySummaries', summaries);
        return summaries[dateKey];
    },
    
    getAllDailySummaries() {
        return getStorage().get('dailySummaries') || {};
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
    },
    
    // Sync existing data from localStorage to financial records
    // This handles past approvals that weren't recorded
    syncExistingData() {
        // Get existing records to avoid duplicates
        const existingMembershipRecords = this.getMembershipRecords();
        const existingDepositRecords = this.getDepositRecords();
        const existingWithdrawalRecords = this.getWithdrawalRecords();
        
        // Sync approved membership requests
        const membershipRequests = getStorage().get('membershipRequests') || [];
        membershipRequests.forEach(r => {
            if (r.status === 'approved' && r.amount > 0) {
                // Check if not already recorded
                const exists = existingMembershipRecords.some(rec => 
                    rec.userId === r.userId && 
                    rec.membershipType === r.membershipName && 
                    Math.abs(new Date(rec.date) - new Date(r.processedAt || r.createdAt)) < 60000
                );
                if (!exists) {
                    const records = this.getMembershipRecords();
                    records.push({
                        id: Date.now() + Math.random(),
                        userId: r.userId,
                        membershipType: r.membershipName,
                        amount: parseFloat(r.amount),
                        date: r.processedAt || r.createdAt,
                        dateKey: (r.processedAt || r.createdAt).split('T')[0]
                    });
                    getStorage().set('membershipRecords', records);
                }
            }
        });
        
        // Sync approved deposits
        const transactions = getStorage().get('transactions') || [];
        transactions.forEach(t => {
            const tUserId = t.userEmail || t.userId; // Handle both field names
            if (t.type === 'deposit' && t.status === 'approved' && t.amount > 0) {
                const exists = existingDepositRecords.some(rec => 
                    (rec.userId === tUserId || rec.userId === t.userEmail || rec.userId === t.userId) && 
                    rec.amount === t.amount &&
                    Math.abs(new Date(rec.date) - new Date(t.processedAt || t.createdAt)) < 60000
                );
                if (!exists) {
                    const records = this.getDepositRecords();
                    records.push({
                        id: Date.now() + Math.random(),
                        userId: tUserId,
                        amount: parseFloat(t.amount),
                        method: t.method || 'manual',
                        date: t.processedAt || t.createdAt,
                        dateKey: (t.processedAt || t.createdAt).split('T')[0]
                    });
                    getStorage().set('depositRecords', records);
                }
            }
            
            // Sync approved withdrawals (handle both 'withdraw' and 'withdrawal' types)
            if ((t.type === 'withdrawal' || t.type === 'withdraw') && t.status === 'approved' && t.amount > 0) {
                const exists = existingWithdrawalRecords.some(rec => 
                    (rec.userId === tUserId || rec.userId === t.userEmail || rec.userId === t.userId) && 
                    rec.amount === t.amount &&
                    Math.abs(new Date(rec.date) - new Date(t.processedAt || t.createdAt)) < 60000
                );
                if (!exists) {
                    const records = this.getWithdrawalRecords();
                    records.push({
                        id: Date.now() + Math.random(),
                        userId: tUserId,
                        amount: parseFloat(t.amount),
                        method: t.method || 'manual',
                        date: t.processedAt || t.createdAt,
                        dateKey: (t.processedAt || t.createdAt).split('T')[0]
                    });
                    getStorage().set('withdrawalRecords', records);
                }
            }
        });
        
        // Update daily summaries
        this.rebuildDailySummaries();
        
        console.log('Financial data synced successfully');
    },
    
    // Rebuild all daily summaries from records
    rebuildDailySummaries() {
        const allDates = new Set();
        
        // Collect all dates from all records
        this.getAdminInvestments().forEach(r => allDates.add(r.dateKey));
        this.getMembershipRecords().forEach(r => allDates.add(r.dateKey));
        this.getProductSaleRecords().forEach(r => allDates.add(r.dateKey));
        this.getDepositRecords().forEach(r => allDates.add(r.dateKey));
        this.getUserEarningRecords().forEach(r => allDates.add(r.dateKey));
        this.getWithdrawalRecords().forEach(r => allDates.add(r.dateKey));
        
        const summaries = {};
        
        allDates.forEach(dateKey => {
            const investments = this.getAdminInvestments().filter(r => r.dateKey === dateKey);
            const memberships = this.getMembershipRecords().filter(r => r.dateKey === dateKey);
            const products = this.getProductSaleRecords().filter(r => r.dateKey === dateKey);
            const deposits = this.getDepositRecords().filter(r => r.dateKey === dateKey);
            const earnings = this.getUserEarningRecords().filter(r => r.dateKey === dateKey);
            const withdrawals = this.getWithdrawalRecords().filter(r => r.dateKey === dateKey);
            
            const adminInvestment = investments.reduce((sum, r) => sum + r.amount, 0);
            const membershipIncome = memberships.reduce((sum, r) => sum + r.amount, 0);
            const productIncome = products.reduce((sum, r) => sum + r.amount, 0);
            const depositIncome = deposits.reduce((sum, r) => sum + r.amount, 0);
            const userEarnings = earnings.reduce((sum, r) => sum + r.amount, 0);
            const withdrawalAmount = withdrawals.reduce((sum, r) => sum + r.amount, 0);
            
            const totalIncome = membershipIncome + productIncome + depositIncome;
            const totalExpense = userEarnings + withdrawalAmount;
            
            summaries[dateKey] = {
                date: dateKey,
                adminInvestment: adminInvestment,
                membershipIncome: membershipIncome,
                productIncome: productIncome,
                depositIncome: depositIncome,
                totalIncome: totalIncome,
                userEarnings: userEarnings,
                withdrawals: withdrawalAmount,
                totalExpense: totalExpense,
                netProfit: totalIncome - totalExpense,
                updatedAt: new Date().toISOString()
            };
        });
        
        getStorage().set('dailySummaries', summaries);
    }
};

// Make it globally available
window.FinancialTracker = FinancialTracker;
