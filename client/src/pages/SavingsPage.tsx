import { useEffect, useState } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import { fetchSavingsEntries } from '../services/savingsService';
import { SavingsRow } from '../services/types';
import { TimeRangeSelector, TimeRange } from '../components/TimeRangeSelector';
import { filterChartDataByTimeRange } from '../utils';

export default function SavingsPage() {
    const [data, setData] = useState<SavingsRow[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Track active time range filter for the trajectory chart
    const [timeRange, setTimeRange] = useState<TimeRange>('ALL');

    // Track collapsed state for each year (default current active year open, older years collapsed)
    const [collapsedYears, setCollapsedYears] = useState<Record<number, boolean>>({});

    useEffect(() => {
        fetchSavingsEntries().then((rows) => {
            setData(rows);

            // Auto-collapse previous years, keep latest year open by default
            const uniqueYears = Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => b - a);
            const initialCollapseState: Record<number, boolean> = {};
            uniqueYears.forEach((yr, index) => {
                initialCollapseState[yr] = index !== 0; // index 0 (latest year) remains expanded
            });
            setCollapsedYears(initialCollapseState);

            setLoading(false);
        }).catch((err) => {
            setError(err.message || 'Failed to load savings data');
            setLoading(false);
        });
    }, []);

    const toggleYear = (year: number) => {
        setCollapsedYears((prev) => ({
            ...prev,
            [year]: !prev[year],
        }));
    };

    // Filter rows for current active year (2026)
    const currentYearRows = data.filter((row) => row.year === 2026 && !row.isEOYRow);
    const latestActiveRow = [...currentYearRows].reverse().find((row) => !row.isFutureMonth);

    // Group all rows by year for tabular display
    const years = Array.from(new Set(data.map((row) => row.year))).sort((a, b) => b - a);

    // Prepare full chronological chart data (oldest to newest)
    const fullChartData = [...data]
        .filter((r) => !r.isEOYRow && !r.isFutureMonth && r.total !== undefined && r.total !== null)
        .sort((a, b) => a.rowIndex - b.rowIndex)
        .map((r) => ({
            year: r.year,
            label: `${r.monthOrLabel.slice(0, 3)} '${String(r.year).slice(-2)}`,
            Total: r.total,
        }));

    // Reusable utility filtering call
    const chartData = filterChartDataByTimeRange(fullChartData, timeRange, years[0]);

    // Compute dynamic gradient offset for zero-crossing on filtered dataset
    const totals = chartData.map((d) => d.Total);
    const maxVal = totals.length > 0 ? Math.max(...totals, 0) : 0;
    const minVal = totals.length > 0 ? Math.min(...totals, 0) : 0;

    const gradientOffset = () => {
        if (maxVal <= 0) return 0;
        if (minVal >= 0) return 1;
        return maxVal / (maxVal - minVal);
    };

    const off = gradientOffset();

    const formatCurrencyCell = (val: number) =>
        val !== 0 ? `$${val.toLocaleString()}` : '-';

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <p className="text-emerald-400 text-lg font-medium">Loading savings dashboard...</p>
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
                        Savings Tracker
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Connected live to Google Sheets ("Numbers" Tab)
                    </p>
                </div>
            </header>

            {/* Summary KPI Cards */}
            {latestActiveRow && (
                <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-sm">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Latest Month ({latestActiveRow.monthOrLabel} {latestActiveRow.year})
                        </span>
                        <p className="text-2xl font-bold text-white mt-1">
                            ${latestActiveRow.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-sm">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Liquid Cash (excluding LCA)
                        </span>
                        <p className="text-2xl font-bold text-emerald-400 mt-1">
                            $
                            {(
                                latestActiveRow.vamshiBofa +
                                latestActiveRow.vamshiDcu +
                                latestActiveRow.priyaBofa +
                                latestActiveRow.priyaEtrade +
                                latestActiveRow.cash
                            ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-sm">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Credit Card Debt
                        </span>
                        <p className="text-2xl font-bold text-rose-400 mt-1">
                            ${Math.abs(latestActiveRow.ccDebt).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-sm">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Auto Loan Balance
                        </span>
                        <p className="text-2xl font-bold text-amber-400 mt-1">
                            ${Math.abs(latestActiveRow.autoLoan).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </section>
            )}

            {/* Visual Savings Trajectory Chart */}
            <section className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg mb-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h2 className="text-lg font-bold text-white">Total Savings Trajectory</h2>
                    <TimeRangeSelector selectedRange={timeRange} onRangeChange={setTimeRange} />
                </div>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                            <defs>
                                {/* Dynamic line stroke gradient */}
                                <linearGradient id="splitStroke" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset={off} stopColor="#10b981" stopOpacity={1} />
                                    <stop offset={off} stopColor="#f43f5e" stopOpacity={1} />
                                </linearGradient>

                                {/* Dynamic area fill gradient */}
                                <linearGradient id="splitFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                                    <stop offset={off} stopColor="#10b981" stopOpacity={0.05} />
                                    <stop offset={off} stopColor="#f43f5e" stopOpacity={0.05} />
                                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.4} />
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
                                tickFormatter={(val) => {
                                    if (val < 0) return `-$${Math.abs(val / 1000).toFixed(0)}k`;
                                    return `$${(val / 1000).toFixed(0)}k`;
                                }}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }}
                                formatter={(value: any) => [`$${(value ?? 0).toLocaleString()}`, 'Total Savings']}
                            />
                            <Area
                                type="monotone"
                                dataKey="Total"
                                stroke="url(#splitStroke)"
                                strokeWidth={3}
                                fill="url(#splitFill)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Yearly Tables (Collapsible Accordion) */}
            {years.map((year) => {
                const yearRows = data.filter((row) => row.year === year);
                const isCollapsed = collapsedYears[year];

                return (
                    <section key={year} className="mb-6 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                        {/* Clickable Header Bar */}
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
                                    className={`w-5 h-5 transform transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'
                                        }`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>

                        {/* Collapsible Table Body */}
                        {!isCollapsed && (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm text-center">
                                    <thead>
                                        <tr className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-700">
                                            <th className="p-3 text-center">Month</th>
                                            <th className="p-3 text-center">Vamshi BoFA</th>
                                            <th className="p-3 text-center">Vamshi DCU</th>
                                            <th className="p-3 text-center">Priya BoFA</th>
                                            <th className="p-3 text-center">Priya E-Trade</th>
                                            <th className="p-3 text-center">Cash</th>
                                            <th className="p-3 text-center">LCA Balance</th>
                                            <th className="p-3 text-center">CC Debt</th>
                                            <th className="p-3 text-center">Auto Loan</th>
                                            <th className="p-3 text-center">$ Change</th>
                                            <th className="p-3 text-center">% Change</th>
                                            <th className="p-3 text-center">Total</th>
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
                                                <td className="p-3 text-center">{formatCurrencyCell(row.vamshiBofa)}</td>
                                                <td className="p-3 text-center">{formatCurrencyCell(row.vamshiDcu)}</td>
                                                <td className="p-3 text-center">{formatCurrencyCell(row.priyaBofa)}</td>
                                                <td className="p-3 text-center">{formatCurrencyCell(row.priyaEtrade)}</td>
                                                <td className="p-3 text-center">{formatCurrencyCell(row.cash)}</td>
                                                <td className="p-3 text-center">{formatCurrencyCell(row.lcaBalance)}</td>
                                                <td className="p-3 text-center text-rose-400">
                                                    {row.ccDebt !== 0 ? `$${row.ccDebt.toLocaleString()}` : '-'}
                                                </td>
                                                <td className="p-3 text-center text-amber-400">
                                                    {row.autoLoan !== 0 ? `$${row.autoLoan.toLocaleString()}` : '-'}
                                                </td>
                                                <td
                                                    className={`p-3 text-center font-medium ${row.dollarChange < 0 ? 'text-rose-400' : 'text-emerald-400'
                                                        }`}
                                                >
                                                    {row.dollarChange !== 0
                                                        ? `${row.dollarChange < 0 ? '-' : ''}$${Math.abs(row.dollarChange).toLocaleString()}`
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
                                                <td className="p-3 text-center font-bold text-white">
                                                    ${row.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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