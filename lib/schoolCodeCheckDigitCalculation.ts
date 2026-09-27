export type CheckDigitCalculationStep = {
	position: number;
	digit: string;
	multiplier: number;
	product: number;
	digitSum: number;
};

export type CheckDigitCalculation = {
	convertedCode: string;
	steps: CheckDigitCalculationStep[];
	sum: number;
	remainder: number;
	checkDigit: string;
};

export function getCalculateSchoolCodeCheckDigit(schoolCode: string): string {
	return getSchoolCodeCheckDigitCalculation(schoolCode).checkDigit;
}

export function getSchoolCodeCheckDigitCalculation(
	schoolCode: string,
): CheckDigitCalculation {
	const normalizedSchoolCode = schoolCode.slice(0, 12);

	const alphabetMap: Record<string, string> = {
		A: "01",
		B: "02",
		C: "03",
		D: "04",
		E: "05",
		F: "06",
		G: "07",
		H: "08",
		I: "09",
		J: "10",
		K: "11",
	};

	const convertedCode =
		alphabetMap[normalizedSchoolCode[0]] + normalizedSchoolCode.slice(1);

	let sum = 0;
	const steps: CheckDigitCalculationStep[] = [];

	for (let i = 0; i < convertedCode.length; i++) {
		const digit = convertedCode[i];
		const multiplier = i % 2 === 0 ? 1 : 2;
		const product = Number(digit) * multiplier;
		const digitSum =
			product >= 10 ? Math.floor(product / 10) + (product % 10) : product;

		sum += digitSum;
		steps.push({
			position: i + 1,
			digit,
			multiplier,
			product,
			digitSum,
		});
	}

	const remainder = sum % 10;
	const result = remainder === 0 ? 0 : 10 - remainder;

	return {
		convertedCode,
		steps,
		sum,
		remainder,
		checkDigit: String(result),
	};
}
