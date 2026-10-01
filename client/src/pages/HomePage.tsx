import { useEffect, useState } from 'react';
import {
    fetchNetWorthEntries,
    fetchSavingsEntries,
    fetchRothEntries,
} from '../services/savingsService';

interface HomePageProps {
    onNavigate?: (page: 'networth' | 'savings' | 'roth') => void;
}

interface MoMStats {
    diffDollar: number;
    diffPercent: number;
}

export default function HomePage({ onNavigate }: HomePageProps) {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Global Active Month State
    const [activeMonth, setActiveMonth] = useState<string>('');

    // KPI Snapshot state
    const [netWorth, setNetWorth] = useState<{ amount: number; mom: MoMStats | null } | null>(null);
    const [savings, setSavings] = useState<{ total: number; liquid: number; mom: MoMStats | null } | null>(null);
    const [roth, setRoth] = useState<{ total: number; pnlDollar: number; pnlPercent: string; mom: MoMStats | null } | null>(null);

    const calculateMoM = (current: number, previous: number): MoMStats | null => {
        if (!previous || previous === 0) return null;
        const diffDollar = current - previous;
        const diffPercent = (diffDollar / previous) * 100;
        return { diffDollar, diffPercent };
    };

    useEffect(() => {
        Promise.all([fetchNetWorthEntries(), fetchSavingsEntries(), fetchRothEntries()])
            .then(([nwData, savingsData, rothData]) => {
                // 1. Net Worth KPI Snapshot & MoM
                const nwActiveRows = nwData.rows.filter(
                    (r) => !r.isEOYRow && !r.isFutureMonth && r.netWorth > 0 && r.monthOrLabel !== `${r.year}`
                );
                const latestNW = nwActiveRows[nwActiveRows.length - 1];
                const prevNW = nwActiveRows[nwActiveRows.length - 2];

                if (latestNW) {
                    setNetWorth({
                        amount: latestNW.netWorth,
                        mom: prevNW ? calculateMoM(latestNW.netWorth, prevNW.netWorth) : null,
                    });

                    // Set header date from latest active entry
                    const cleanMonth = latestNW.monthOrLabel.replace(String(latestNW.year), '').trim();
                    setActiveMonth(`${cleanMonth} ${latestNW.year}`);
                }

                // 2. Savings KPI Snapshot & MoM
                const savingsActiveRows = savingsData.filter((r) => !r.isEOYRow && !r.isFutureMonth);
                const latestSavings = savingsActiveRows[savingsActiveRows.length - 1];
                const prevSavings = savingsActiveRows[savingsActiveRows.length - 2];

                if (latestSavings) {
                    const liquidCash =
                        latestSavings.vamshiBofa +
                        latestSavings.vamshiDcu +
                        latestSavings.vamshiHood +
                        latestSavings.priyaBofa +
                        latestSavings.priyaEtrade +
                        latestSavings.cash;

                    setSavings({
                        total: latestSavings.total,
                        liquid: liquidCash,
                        mom: prevSavings ? calculateMoM(latestSavings.total, prevSavings.total) : null,
                    });
                }

                // 3. Roth IRA KPI Snapshot & MoM
                const rothActiveRows = rothData.rows.filter(
                    (r) => !r.isEoYRow && !r.isContributionsRow && !r.isFutureMonth
                );
                const latestRoth = rothActiveRows[rothActiveRows.length - 1];
                const prevRoth = rothActiveRows[rothActiveRows.length - 2];

                if (latestRoth && rothData.kpis) {
                    setRoth({
                        total: latestRoth.rothBoth,
                        pnlDollar: rothData.kpis.totalPnlDollar,
                        pnlPercent: rothData.kpis.totalPnlPercent,
                        mom: prevRoth ? calculateMoM(latestRoth.rothBoth, prevRoth.rothBoth) : null,
                    });
                }

                setLoading(false);
            })
            .catch((err) => {
                setError(err.message || 'Failed to load dashboard overview');
                setLoading(false);
            });
    }, []);

    const formatCurrency = (val: number) =>
        `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const renderMoMBadge = (mom: MoMStats | null) => {
        if (!mom) return null;

        const isPositive = mom.diffDollar >= 0;
        const sign = isPositive ? '+' : '';
        const arrow = isPositive ? '↑' : '↓';

        return (
            <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                    isPositive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
            >
                <span>{arrow}</span>
                <span>
                    {sign}{formatCurrency(mom.diffDollar)} ({sign}{mom.diffPercent.toFixed(1)}%) MoM
                </span>
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <p className="text-emerald-400 text-lg font-medium">Loading Overview Dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg max-w-md">
                    <p className="font-bold">Error Loading Overview</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header with Global Active Month Badge */}
            <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                            Overview
                        </h1>
                        {activeMonth && (
                            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 rounded-full shadow-sm">
                                {activeMonth}
                            </span>
                        )}
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                        Select a category to view full logs and detailed breakdowns.
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Net Worth Card */}
                <div
                    onClick={() => onNavigate?.('networth')}
                    className="bg-slate-800 border border-slate-700 hover:border-emerald-500/60 p-6 rounded-xl shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                >
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                                Net Worth
                            </h2>
                            <svg
                                className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                        <p className="text-slate-400 text-xs uppercase font-semibold tracking-wider mb-1">
                            Current Balance
                        </p>
                        <p className="text-3xl font-extrabold text-emerald-400">
                            {netWorth ? formatCurrency(netWorth.amount) : '-'}
                        </p>
                        <div className="mt-2">
                            {renderMoMBadge(netWorth?.mom || null)}
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-700/60 flex justify-between items-center text-xs text-slate-400">
                        <span>Connected to Numbers Tab</span>
                        <span className="text-emerald-400 font-medium group-hover:underline">View Dashboard &rarr;</span>
                    </div>
                </div>

                {/* 2. Savings Tracker Card */}
                <div
                    onClick={() => onNavigate?.('savings')}
                    className="bg-slate-800 border border-slate-700 hover:border-emerald-500/60 p-6 rounded-xl shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                >
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                                Savings Tracker
                            </h2>
                            <svg
                                className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                        <p className="text-slate-400 text-xs uppercase font-semibold tracking-wider mb-1">
                            Total Savings
                        </p>
                        <p className="text-3xl font-extrabold text-white">
                            {savings ? formatCurrency(savings.total) : '-'}
                        </p>
                        <div className="mt-2">
                            {renderMoMBadge(savings?.mom || null)}
                        </div>
                        <div className="mt-3 text-xs text-slate-300 flex justify-between">
                            <span className="text-slate-400">Liquid Cash & Savings:</span>
                            <span className="font-semibold text-emerald-400">{savings ? formatCurrency(savings.liquid) : '-'}</span>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-700/60 flex justify-between items-center text-xs text-slate-400">
                        <span>BoFA, DCU, E-Trade, Cash</span>
                        <span className="text-emerald-400 font-medium group-hover:underline">View Dashboard &rarr;</span>
                    </div>
                </div>

                {/* 3. Roth IRA Card */}
                <div
                    onClick={() => onNavigate?.('roth')}
                    className="bg-slate-800 border border-slate-700 hover:border-emerald-500/60 p-6 rounded-xl shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                >
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                                Roth IRA Tracker
                            </h2>
                            <svg
                                className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                        <p className="text-slate-400 text-xs uppercase font-semibold tracking-wider mb-1">
                            Combined Balance
                        </p>
                        <p className="text-3xl font-extrabold text-white">
                            {roth ? formatCurrency(roth.total) : '-'}
                        </p>
                        <div className="mt-2">
                            {renderMoMBadge(roth?.mom || null)}
                        </div>
                        <div className="mt-3 text-xs text-slate-300 flex justify-between">
                            <span className="text-slate-400">Combined PnL:</span>
                            <span className="font-semibold text-emerald-400">
                                {roth ? `${formatCurrency(roth.pnlDollar)} (${roth.pnlPercent})` : '-'}
                            </span>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-700/60 flex justify-between items-center text-xs text-slate-400">
                        <span>Vamshi & Priya Combined</span>
                        <span className="text-emerald-400 font-medium group-hover:underline">View Dashboard &rarr;</span>
                    </div>
                </div>
            </div>
        </div>
    );
}