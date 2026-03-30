/** Row from GET /api/v1/info */
export interface PacificaMarketInfoRow {
	symbol: string;
	tick_size: string;
	min_tick: string;
	max_tick: string;
	lot_size: string;
	max_leverage: number;
	isolated_only: boolean;
	min_order_size: string;
	max_order_size: string;
	funding_rate: string;
	next_funding_rate: string;
	created_at: number;
}

export interface PacificaMarketInfoListResponse {
	success: boolean;
	data: PacificaMarketInfoRow[] | null;
	error?: string | null;
	code?: string | null;
}

export interface PacificaAccountData {
	balance: string;
	fee_level: number;
	maker_fee: string;
	taker_fee: string;
	account_equity: string;
	available_to_spend: string;
	available_to_withdraw: string;
	pending_balance: string;
	total_margin_used: string;
	cross_mmr: string;
	positions_count: number;
	orders_count: number;
	stop_orders_count: number;
	updated_at: number;
	use_ltp_for_stop_orders: boolean;
}

export interface PacificaAccountInfoResponse {
	success: boolean;
	data: PacificaAccountData | null;
	error?: string | null;
	code?: string | null;
}

/** Row from GET /api/v1/info/prices */
export interface PacificaPriceRow {
	symbol: string;
	mark: string;
	mid: string;
	oracle?: string;
	timestamp?: number;
}

export interface PacificaPricesListResponse {
	success: boolean;
	data: PacificaPriceRow[] | null;
	error?: string | null;
	code?: string | null;
}
