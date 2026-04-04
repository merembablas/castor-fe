const metricFormatter = new Intl.NumberFormat(undefined, {
	minimumFractionDigits: 0,
	maximumFractionDigits: 2
});

export function formatSignalMetricValue(value: number): string {
	return metricFormatter.format(value);
}
