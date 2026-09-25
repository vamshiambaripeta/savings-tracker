export type TimeRange = '3M' | '6M' | 'YTD' | '1Y' | 'ALL';

interface TimeRangeSelectorProps {
    selectedRange: TimeRange;
    onRangeChange: (range: TimeRange) => void;
    options?: TimeRange[];
}

export function TimeRangeSelector({
    selectedRange,
    onRangeChange,
    options = ['3M', '6M', 'YTD', '1Y', 'ALL'],
}: TimeRangeSelectorProps) {
    return (
        <div className="inline-flex bg-slate-900/80 p-1 rounded-lg border border-slate-700/80 self-start sm:self-auto">
            {options.map((range) => (
                <button
                    key={range}
                    type="button"
                    onClick={() => onRangeChange(range)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer ${
                        selectedRange === range
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                >
                    {range}
                </button>
            ))}
        </div>
    );
}