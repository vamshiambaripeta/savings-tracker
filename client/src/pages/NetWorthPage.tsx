import { useEffect, useState } from 'react';
import { fetchNetWorthEntries } from '../services/savingsService';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import { NetWorthRow, NetWorthBreakdown } from '../services/types';
import { TimeRangeSelector, TimeRange } from '../components/TimeRangeSelector';
import { filterChartDataByTimeRange } from '../utils';

interface NetWorthPageProps {
    onNavigate?: (page: 'networth' | 'savings' | 'roth') => void;
}

interface NetWorthChartProps {
    data: NetWorthRow[];
    timeRange: TimeRange;
    onRangeChange: (range: TimeRange) => void;
    years: number[];
}

const VALID_MONTHS = new Set([
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
]);

const NetWorthChart = ({ data, timeRange, onRangeChange, years }: NetWorthChartProps) => {
    const fullChartData = [...data]
        .filter((r) => {
            if (!r.monthOrLabel || r.isEOYRow || r.isFutureMonth || r.netWorth <= 0) return false;

            const monthPrefix = r.monthOrLabel.trim().slice(0, 3).toLowerCase();
            return VALID_MONTHS.has(monthPrefix);
        })
        .sort((a, b) => a.rowIndex - b.rowIndex)
        .map((r) => ({
            year: r.year,
            label: `${r.monthOrLabel.trim().slice(0, 3)} '${String(r.year).slice(-2)}`,
            "Net Worth": r.netWorth,
        }));

    const chartData = filterChartDataByTimeRange(fullChartData, timeRange, years[0]);

    return (
        <section className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-white">Overall Net Worth Trajectory</h2>
                <TimeRangeSelector selectedRange={timeRange} onRangeChange={onRangeChange} />
            </div>

            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <defs>
                            <linearGradient id="nwColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                            dataKey="label"
                            stroke="#94a3b8"
                            fontSize={11}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            dy={5}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={12}
                            domain={['auto', 'auto']}
                            tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }}
                            formatter={(value: any) => [
                                `$${(value ?? 0).toLocaleString()}`,
                                'Net Worth'
                            ]}
                        />
                        <Area
                            type="monotone"
                            dataKey="Net Worth"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#nwColor)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
};

export default function NetWorthPage({ onNavigate }: NetWorthPageProps) {
    const [rows, setRows] = useState<NetWorthRow[]>([]);
    const [summary, setSummary] = useState<NetWorthBreakdown | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
    const [collapsedYears, setCollapsedYears] = useState<Record<number, boolean>>({});

    useEffect(() => {
        fetchNetWorthEntries()
            .then((data) => {
                setRows(data.rows);
                setSummary(data.summary);

                const uniqueYears = Array.from(new Set(data.rows.map((r) => r.year))).sort((a, b) => b - a);
                const initialCollapseState: Record<number, boolean> = {};
                uniqueYears.forEach((yr, index) => {
                    initialCollapseState[yr] = index !== 0;
                });
                setCollapsedYears(initialCollapseState);

                setLoading(false);
            })
            .catch((err) => {
                setError(err.message || 'Failed to load net worth data');
                setLoading(false);
            });
    }, []);

    const toggleYear = (year: number) => {
        setCollapsedYears((prev) => ({
            ...prev,
            [year]: !prev[year],
        }));
    };

    const activeRows = rows.filter((r) => {
        if (!r.monthOrLabel || r.isEOYRow || r.isFutureMonth || r.netWorth <= 0) return false;
        const monthPrefix = r.monthOrLabel.trim().slice(0, 3).toLowerCase();
        return VALID_MONTHS.has(monthPrefix);
    });

    const latestActiveRow = activeRows[activeRows.length - 1];

    const years = Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => b - a);

    const formatCurrency = (val: number) =>
        val !== 0 ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <p className="text-emerald-400 text-lg font-medium">Loading Net Worth dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg max-w-md">
                    <p className="font-bold">Error Loading Data</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                        Net Worth
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Connected live to Google Sheets ("Numbers" Tab)
                    </p>
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Static Net Worth Card */}
                <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-sm">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Current Net Worth ({latestActiveRow?.monthOrLabel} {latestActiveRow?.year})
                    </span>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                        {latestActiveRow ? formatCurrency(latestActiveRow.netWorth) : '-'}
                    </p>
                </div>

                {/* Clickable Liquid Cash Card -> Navigates to Savings */}
                <div
                    onClick={() => onNavigate?.('savings')}
                    className="bg-slate-800 border border-slate-700 hover:border-emerald-500/60 p-5 rounded-xl shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-slate-300 transition-colors">
                            Liquid Cash
                        </span>
                        <svg
                            className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                    <p className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors mt-1">
                        {summary ? formatCurrency(summary.cash) : '-'}
                    </p>
                </div>

                {/* Clickable Combined IRA Total Card -> Navigates to Roth IRA */}
                <div
                    onClick={() => onNavigate?.('roth')}
                    className="bg-slate-800 border border-slate-700 hover:border-emerald-500/60 p-5 rounded-xl shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-slate-300 transition-colors">
                            Combined IRA Total
                        </span>
                        <svg
                            className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                    <p className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors mt-1">
                        {summary ? formatCurrency(summary.iras) : '-'}
                    </p>
                </div>
            </section>

            <NetWorthChart
                data={rows}
                timeRange={timeRange}
                onRangeChange={setTimeRange}
                years={years}
            />

            {years.map((year) => {
                const yearRows = rows.filter((r) => r.year === year);
                const isCollapsed = collapsedYears[year];

                return (
                    <section key={year} className="mb-6 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                        <button
                            onClick={() => toggleYear(year)}
                            className="w-full bg-slate-800/90 hover:bg-slate-750 px-6 py-4 border-b border-slate-700/80 flex justify-between items-center transition-colors text-left focus:outline-none cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-bold text-white">{year}</h2>
                                <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-slate-700 text-slate-300">
                                    {yearRows.filter((r) => !r.isEOYRow && !r.isFutureMonth).length} Months
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                                <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
                                <svg
                                    className={`w-5 h-5 transform transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>

                        {!isCollapsed && (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm text-center">
                                    <thead>
                                        <tr className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-700">
                                            <th className="p-3 text-center">Month</th>
                                            <th className="p-3 text-center">Monthly Networth</th>
                                            <th className="p-3 text-center">$ Change</th>
                                            <th className="p-3 text-center">% Change</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {yearRows.map((row) => (
                                            <tr
                                                key={`${row.year}-${row.rowIndex}`}
                                                className={
                                                    row.isEOYRow
                                                        ? 'bg-emerald-950/30 font-bold text-emerald-300'
                                                        : row.isFutureMonth
                                                            ? 'opacity-40 text-slate-500'
                                                            : 'hover:bg-slate-700/30 transition-colors'
                                                }
                                            >
                                                <td className="p-3 text-center font-medium">{row.monthOrLabel}</td>
                                                <td className="p-3 text-center font-bold text-white">
                                                    {formatCurrency(row.netWorth)}
                                                </td>
                                                <td
                                                    className={`p-3 text-center font-medium ${row.dollarChange < 0
                                                        ? 'text-rose-400'
                                                        : row.dollarChange > 0
                                                            ? 'text-emerald-400'
                                                            : 'text-slate-400'
                                                        }`}
                                                >
                                                    {row.dollarChange !== 0
                                                        ? `${row.dollarChange < 0 ? '-' : ''}$${Math.abs(row.dollarChange).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                                                        : '-'}
                                                </td>
                                                <td
                                                    className={`p-3 text-center font-medium ${row.dollarChange < 0
                                                        ? 'text-rose-400'
                                                        : row.dollarChange > 0
                                                            ? 'text-emerald-400'
                                                            : 'text-slate-400'
                                                        }`}
                                                >
                                                    {row.percentChange || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                );
            })}
        </div>
    );
}