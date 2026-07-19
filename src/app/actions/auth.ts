'use server';

import { supabase } from '@/lib/supabase';

export async function serverSupabaseInsertUser(userData: any): Promise<{ success: boolean; message?: string }> {
    try {
        const row = {
            id: userData.id,
            name: userData.name || userData.fullName || '',
            email: userData.email,
            phone: userData.phone || '',
            password: userData.password || '',
            role: userData.role || 'user',
            balance: userData.balance || 0,
            points: userData.points || 0,
            membership: userData.membership || 'free',
            status: userData.status || 'active',
            referral_code: userData.referralCode || '',
            referred_by: userData.referredBy || null,
            total_invested: userData.totalInvested || 0,
            total_profit: userData.totalProfit || 0,
            referral_earnings: userData.referralEarnings || 0,
            bkash_number: userData.bkashNumber || '',
            nagad_number: userData.nagadNumber || '',
            created_at: userData.createdAt || new Date().toISOString(),
        };

        const { error } = await supabase.from('users').upsert(row, { onConflict: 'id' });
        
        if (error) {
            console.warn('Server Supabase insert user error:', error.message);
            return { success: false, message: error.message };
        }
        
        return { success: true };
    } catch (e: any) {
        console.warn('Server Supabase insert user exception:', e);
        return { success: false, message: e.message || 'Unknown error' };
    }
}
