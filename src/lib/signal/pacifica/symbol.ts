/**
 * Maps slug / view-model tickers to Pacifica `symbol` query values (uppercase ASCII).
 */
export function toPacificaSymbol(token: string): string {
	return token.trim().toUpperCase();
}
