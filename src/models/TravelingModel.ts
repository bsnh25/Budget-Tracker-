import { supabase } from '../supabaseClient';
import { Trip, ExchangeRates } from '../types';

export const TravelingModel = {
  fetchExchangeRates: async (userId?: string): Promise<ExchangeRates> => {
    try {
      if (typeof window === 'undefined') {
        return TravelingModel.getFallbackRates();
      }

      const now = Date.now();
      const cachedRates = localStorage.getItem('harmony_budget_rates');
      const cachedTime = localStorage.getItem('harmony_budget_rates_time');
      
      // 1. Check local cache (Update once a week = 7 days = 604800000 ms)
      if (cachedRates && cachedTime && (now - Number(cachedTime) < 604800000)) {
        try {
          const parsed = JSON.parse(cachedRates) as ExchangeRates;
          return parsed;
        } catch (e) {
          console.error('Error parsing cached exchange rates:', e);
        }
      }

      // 2. Check Database Cache if user is logged in
      if (userId) {
        try {
          const { data, error } = await supabase
            .from('history')
            .select('*')
            .eq('user_id', userId)
            .eq('month_id', 'SYSTEM_RATES')
            .maybeSingle();

          if (!error && data) {
            const payload = data.transactions as any;
            if (payload && payload.rates && payload.updated_at) {
              const dbRates = payload.rates as ExchangeRates;
              const dbTime = Number(payload.updated_at);
              // If stored within 7 days, use it and update local storage!
              if (now - dbTime < 604800000) {
                localStorage.setItem('harmony_budget_rates', JSON.stringify(dbRates));
                localStorage.setItem('harmony_budget_rates_time', dbTime.toString());
                console.log('Successfully retrieved fresh exchange rates from Supabase database.');
                return dbRates;
              }
            }
          }
        } catch (dbErr) {
          console.error('Failed to read exchange rates from database:', dbErr);
        }
      }

      // 3. Fallback to External APIs (only when cached/database rates are older than 7 days)
      const endpoints = [
        'https://open.er-api.com/v6/latest/IDR',
        'https://api.frankfurter.dev/latest?from=IDR',
        'https://api.frankfurter.app/latest?from=IDR'
      ];

      for (const url of endpoints) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout per request

        try {
          console.log(`Attempting to fetch exchange rates from: ${url}`);
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const rates: ExchangeRates = {};
            if (data.rates) {
              Object.keys(data.rates).forEach(cur => {
                const rawRate = data.rates[cur];
                if (typeof rawRate === 'number' && rawRate > 0) {
                  rates[cur] = 1 / rawRate;
                }
              });
              
              // Ensure base currency IDR is exactly 1
              rates['IDR'] = 1;

              // Save to Local Storage
              localStorage.setItem('harmony_budget_rates', JSON.stringify(rates));
              localStorage.setItem('harmony_budget_rates_time', now.toString());

              // Save to Database Cache if user is logged in
              if (userId) {
                try {
                  const payload = {
                    rates,
                    updated_at: now
                  };
                  await supabase
                    .from('history')
                    .upsert({
                      user_id: userId,
                      month_id: 'SYSTEM_RATES',
                      monthly_income: 0,
                      categories: [],
                      transactions: payload as any
                    }, {
                      onConflict: 'user_id,month_id'
                    });
                  console.log('Successfully saved updated exchange rates to Supabase database.');
                } catch (dbSaveErr) {
                  console.error('Failed to save exchange rates to database:', dbSaveErr);
                }
              }

              console.log('Successfully updated exchange rates from network:', url);
              return rates;
            }
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          console.warn(`Fetch to ${url} failed or timed out:`, fetchErr);
        }
      }

      // 4. Ultimate Database Fallback (if network calls failed, try to return database rates even if older than 7 days)
      if (userId) {
        try {
          const { data, error } = await supabase
            .from('history')
            .select('*')
            .eq('user_id', userId)
            .eq('month_id', 'SYSTEM_RATES')
            .maybeSingle();

          if (!error && data) {
            const payload = data.transactions as any;
            if (payload && payload.rates) {
              console.log('Using older database rates as fallback.');
              return payload.rates as ExchangeRates;
            }
          }
        } catch (dbErr) {
          console.error('Database fallback read failed:', dbErr);
        }
      }
    } catch (e) {
      console.error('Failed to fetch exchange rates, using offline defaults:', e);
    }
    
    return TravelingModel.getFallbackRates();
  },

  getFallbackRates(): ExchangeRates {
    return {
      USD: 16350,
      JPY: 104.5,
      SGD: 12050,
      EUR: 17500,
      MYR: 3450,
      THB: 445,
      KRW: 11.8,
      AUD: 10800,
      GBP: 20700,
      IDR: 1, // Base currency is IDR
    };
  },

  loadTrips(userId?: string): Trip[] {
    if (typeof window === 'undefined') return [];
    try {
      const key = userId ? `harmony_budget_state_${userId}` : 'harmony_budget_state_guest';
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.trips && Array.isArray(parsed.trips)) {
          // Robust null-safety map to ensure fields exist
          return parsed.trips.map((t: any) => ({
            id: t.id || 'trip-' + Math.random().toString(36).substr(2, 9),
            name: t.name || '',
            startDate: t.startDate || '',
            endDate: t.endDate || '',
            totalBudget: Number(t.totalBudget) || 0,
            currency: t.currency || 'USD',
            archived: !!t.archived,
            categories: Array.isArray(t.categories) 
              ? t.categories.map((c: any) => ({
                  name: c.name || '',
                  limit: Number(c.limit) || 0,
                  spent: Number(c.spent) || 0,
                  remaining: Number(c.remaining) || 0,
                  ratio: Number(c.ratio) || 0
                }))
              : []
          }));
        }
      }
    } catch (err) {
      console.error('Error loading trips from local storage:', err);
    }
    return [];
  },

  loadActiveTripId(userId?: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const key = userId ? `harmony_budget_state_${userId}` : 'harmony_budget_state_guest';
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.activeTripId || null;
      }
    } catch (err) {
      console.error('Error loading activeTripId:', err);
    }
    return null;
  }
};
