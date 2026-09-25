import { useEffect, useState } from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
} from 'recharts';
import { fetchRothEntries } from '../services/savingsService';
import { RothKpiData, RothRow } from '../services/types';
import { TimeRangeSelector, TimeRange } from '../components/TimeRangeSelector';
import { filterChartDataByTimeRange } from '../utils';

export default function RothIRAPage() {
    const [kpis, setKpis] = useState<RothKpiData | null>(null);
    const [data, setData] = useState<RothRow[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
    const [collapsedYears, setCollapsedYears] = useState<Record<number, boolean>>({});

    const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
        Combined: true,
        Vamshi: false,
        Priya: false,
    });

    useEffect(() => {
        fetchRothEntries()
            .then((res) => {
                setKpis(res.kpis);
                setData(res.rows);

                const uniqueYears = Array.from(new Set(res.rows.map((r) => r.year))).sort((a, b) => b - a);
                const initialCollapseState: Record<number, boolean> = {};
                uniqueYears.forEach((yr, index) => {
                    initialCollapseState[yr] = index !== 0;
                });
                setCollapsedYears(initialCollapseState);

                setLoading(false);
            })
            .catch((err) => {
                setError(err.message || 'Failed to load Roth IRA data');
                setLoading(false);
            });
    }, []);

    const toggleYear = (year: number) => {
        setCollapsedYears((prev) => ({
            ...prev,
            [year]: !prev[year],
        }));
    };

    const handleLegendClick = (e: any) => {
        const { dataKey } = e;
        if (!dataKey) return;

        setVisibleLines((prev) => ({
            ...prev,
            [dataKey]: !prev[dataKey],
        }));
    };

    const formatCurrency = (val: number) =>
        val !== 0 ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';

    const years = Array.from(new Set(data.map((row) => row.year))).sort((a, b) => b - a);

    const activeMonthRows = data.filter(
        (r) => !r.isEoYRow && !r.isContributionsRow && !r.isFutureMonth
    );

    const latestRow = activeMonthRows[activeMonthRows.length - 1] || {
        vamshiBalance: 0,
        priyaBalance: 0,
        rothBoth: 0,
    };

    const fullChartData = [...data]
        .filter((r) => !r.isEoYRow && !r.isContributionsRow && !r.isFutureMonth && r.rothBoth !== undefined && r.rothBoth !== null)
        .sort((a, b) => a.rowIndex - b.rowIndex)
        .map((r) => ({
            year: r.year,
            label: `${r.monthOrLabel.slice(0, 3)} '${String(r.year).slice(-2)}`,
            Combined: r.rothBoth,
            Vamshi: r.vamshiBalance,
            Priya: r.priyaBalance,
        }));

    // Clean reusable call
    const chartData = filterChartDataByTimeRange(fullChartData, timeRange, years[0]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <p className="text-emerald-400 text-lg font-medium">Loading Roth IRA dashboard...</p>
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
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                    Roth IRA Tracker
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    Connected live to Google Sheets ("Numbers" Tab — O:T Columns)
                </p>
            </header>

            {kpis && (
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-sm">
                        <h3 className="text-sm md:text-base font-semibold text-slate-300 uppercase tracking-wide mb-3">
                            ROTH IRA - VAMSHI
                        </h3>
                        <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Total Contributions:</span>
                                <span className="font-medium text-slate-200">${kpis.vamshiContributions.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Current Balance:</span>
                                <span className="font-semibold text-white">{formatCurrency(latestRow.vamshiBalance)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">PnL ($):</span>
                                <span className="font-semibold text-emerald-400">${kpis.vamshiPnlDollar.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">PnL (%):</span>
                                <span className="font-semibold text-emerald-400">{kpis.vamshiPnlPercent}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-sm">
                        <h3 className="text-sm md:text-base font-semibold text-slate-300 uppercase tracking-wide mb-3">
                            ROTH IRA - PRIYA
                        </h3>
                        <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Total Contributions:</span>
                                <span className="font-medium text-slate-200">${kpis.priyaContributions.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Current Balance:</span>
                                <span className="font-semibold text-white">{formatCurrency(latestRow.priyaBalance)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">PnL ($):</span>
                                <span className="font-semibold text-emerald-400">${kpis.priyaPnlDollar.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">PnL (%):</span>
                                <span className="font-semibold text-emerald-400">{kpis.priyaPnlPercent}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-sm bg-gradient-to-br from-slate-800 to-slate-800/90">
                        <h3 className="text-sm md:text-base font-semibold text-slate-300 uppercase tracking-wide mb-3">
                            ROTH BOTH (COMBINED)
                        </h3>
                        <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Total Contributions:</span>
                                <span className="font-medium text-slate-200">${kpis.totalContributions.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Current Balance:</span>
                                <span className="font-semibold text-white">{formatCurrency(latestRow.rothBoth)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">PnL ($):</span>
                                <span className="font-bold text-emerald-400">${kpis.totalPnlDollar.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">PnL (%):</span>
                                <span className="font-bold text-emerald-400">{kpis.totalPnlPercent}</span>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <section className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg mb-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h2 className="text-lg font-bold text-white">Roth IRA Trajectory</h2>
                    <TimeRangeSelector selectedRange={timeRange} onRangeChange={setTimeRange} />
                </div>

                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
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
                                formatter={(value: any) => [`$${(value ?? 0).toLocaleString()}`]}
                            />
                            <Legend
                                position="bottom"
                                wrapperStyle={{ paddingBottom: '10px', cursor: 'pointer', userSelect: 'none' }}
                                onClick={handleLegendClick}
                            />
                            <Line
                                type="monotone"
                                dataKey="Combined"
                                name="Combined Total"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={false}
                                hide={!visibleLines.Combined}
                            />
                            <Line
                                type="monotone"
                                dataKey="Vamshi"
                                name="Vamshi Balance"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={false}
                                hide={!visibleLines.Vamshi}
                            />
                            <Line
                                type="monotone"
                                dataKey="Priya"
                                name="Priya Balance"
                                stroke="#a855f7"
                                strokeWidth={2}
                                dot={false}
                                hide={!visibleLines.Priya}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {years.map((year) => {
                const yearRows = data.filter((row) => row.year === year);
                const isCollapsed = collapsedYears[year];

                return (
                    <section key={year} className="mb-6 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                        <button
                            onClick={() => toggleYear(year)}
                            className="w-full bg-slate-800/90 hover:bg-slate-750 px-6 py-4 border-b border-slate-700/80 flex justify-between items-center transition-colors text-left focus:outline-none cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-bold text-slate-100">{year} Roth IRA Log</span>
                                <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-slate-700 text-slate-300">
                                    {yearRows.filter((r) => !r.isEoYRow && !r.isContributionsRow && !r.isFutureMonth).length} Months
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
                                            <th className="p-3 text-center">Month / Label</th>
                                            <th className="p-3 text-center">Roth IRA - Vamshi</th>
                                            <th className="p-3 text-center">Roth IRA - Priya</th>
                                            <th className="p-3 text-center">$ Change</th>
                                            <th className="p-3 text-center">% Change</th>
                                            <th className="p-3 text-center">Roth Both</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {yearRows.map((row) => (
                                            <tr
                                                key={`${row.year}-${row.rowIndex}`}
                                                className={
                                                    row.isEoYRow
                                                        ? 'bg-emerald-950/30 font-bold text-emerald-300'
                                                        : row.isContributionsRow
                                                            ? 'bg-slate-900/40 font-semibold text-slate-300'
                                                            : row.isFutureMonth
                                                                ? 'opacity-40 text-slate-500'
                                                                : 'hover:bg-slate-700/30 transition-colors'
                                                }
                                            >
                                                <td className="p-3 text-center font-medium">{row.monthOrLabel}</td>
                                                <td className="p-3 text-center">{formatCurrency(row.vamshiBalance)}</td>
                                                <td className="p-3 text-center">{formatCurrency(row.priyaBalance)}</td>
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
                                                <td className="p-3 text-center font-bold text-white">
                                                    {formatCurrency(row.rothBoth)}
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