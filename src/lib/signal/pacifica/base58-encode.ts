/** Bitcoin/Solana alphabet — encodes signature bytes for Pacifica REST. */
const BASE58 =
	'123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function base58Encode(buffer: Uint8Array): string {
	const digits: number[] = [0];
	for (let i = 0; i < buffer.length; i += 1) {
		let carry = buffer[i]!;
		for (let j = 0; j < digits.length; j += 1) {
			carry += digits[j]! << 8;
			digits[j] = carry % 58;
			carry = (carry / 58) | 0;
		}
		while (carry) {
			digits.push(carry % 58);
			carry = (carry / 58) | 0;
		}
	}
	let str = '';
	for (let k = 0; k < buffer.length - 1 && buffer[k] === 0; k += 1) {
		str += BASE58[0];
	}
	for (let q = digits.length - 1; q >= 0; q -= 1) {
		str += BASE58[digits[q]!]!;
	}
	return str;
}
