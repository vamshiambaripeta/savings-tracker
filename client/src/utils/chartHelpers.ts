import { TimeRange } from '../components/TimeRangeSelector';

export interface BaseChartPoint {
    year: number;
    [key: string]: any;
}

export const filterChartDataByTimeRange = <T extends BaseChartPoint>(
    fullChartData: T[],
    timeRange: TimeRange,
    latestYear?: number
): T[] => {
    if (fullChartData.length === 0) return [];

    const currentYear = new Date().getFullYear();

    switch (timeRange) {
        case '3M':
            return fullChartData.slice(-3);
        case '6M':
            return fullChartData.slice(-6);
        case '1Y':
            return fullChartData.slice(-12);
        case 'YTD': {
            const ytdData = fullChartData.filter((d) => d.year === currentYear);
            if (ytdData.length > 0) return ytdData;

            // Fallback to the latest available year in data if current calendar year isn't present
            const fallbackYear = latestYear ?? fullChartData[fullChartData.length - 1]?.year;
            return fullChartData.filter((d) => d.year === fallbackYear);
        }
        case 'ALL':
        default:
            return fullChartData;
    }
};