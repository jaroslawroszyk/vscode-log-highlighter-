export function escapeRegExp(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function randomColor(): string {
	const colors = ['#ffff99', '#ffcccb', '#ccffcc', '#ccccff', '#ffcc99'];
	return colors[Math.floor(Math.random() * colors.length)];
}
