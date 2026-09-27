import fs, { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import csv from "csv-parser";
import { schoolCodeAnalysis } from "@/lib/schoolCodeAnalysis.js";
import type { OutputJson } from "@/types/OutputJson";
import type {
	InstitutionOwnershipJa,
	PrefecturesJaShort,
	SchoolTypeJa,
} from "@/types/schoolCode";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const configs = [
	{
		targetYear: 2026,
		fileNames: [
			"20260825-mxt_chousa01-000011635_2-1.csv",
			"20260825-mxt_chousa01-000011635_2-2.csv",
			"20260825-mxt_chousa01-000011635_4.csv",
		],
	},
];

async function main() {
	console.log("----------------------------------------");

	for (const config of configs) {
		console.log(`${config.targetYear}年 の処理を開始します。`);
		await importSchoolCode(config.targetYear, config.fileNames);
		console.log(`${config.targetYear}年 の処理が完了しました。`);
		console.log("----------------------------------------");
	}
}
main();

type SchoolCodeCsvRow = {
	学校コード: string;
	学校種: string;
	都道府県番号: string;
	設置区分: string;
	本分校: string;
	学校名: string;
	学校所在地: string;
	郵便番号: string;
	属性情報設定年月日: string;
	属性情報廃止年月日: string;
	旧学校調査番号: string;
	移行後の学校コード: string;
};

type SchoolCodeCsvObj = {
	学校コード: string;
	学校種: SchoolTypeJa;
	都道府県番号: PrefecturesJaShort;
	設置区分: InstitutionOwnershipJa;
	本分校: "本校" | "分校" | "廃校";
	学校名: string;
	学校所在地: string;
	郵便番号: string;
	属性情報設定年月日: string;
	属性情報廃止年月日: string;
	旧学校調査番号: string;
	移行後の学校コード: string | null;
};

async function importSchoolCode(targetYear: number, fileNames: string[]) {
	const outputFile = new URL(
		`../public/output${targetYear}.json`,
		import.meta.url,
	);

	const outputJson: OutputJson[] = [];

	for (const fileName of fileNames) {
		const csvFilePath = path.resolve(
			scriptDir,
			`../data/schoolCode/${targetYear}/${fileName}`,
		);

		const schoolCodeCsvObj = await new Promise<SchoolCodeCsvObj[]>(
			(resolve, reject) => {
				const normalizeCsvHeaderKey = (key: string) =>
					key.replace(/[\r\n]/g, "");

				const rows: SchoolCodeCsvObj[] = [];

				fs.createReadStream(csvFilePath)
					.pipe(
						csv({
							mapHeaders: ({ header }) => normalizeCsvHeaderKey(header),
						}),
					)
					.on("data", (data: SchoolCodeCsvRow) => {
						const schoolCodeDetail = schoolCodeAnalysis(data.学校コード);
						rows.push({
							...data,
							学校コード: schoolCodeDetail.schoolCode,
							学校種: schoolCodeDetail.schoolType.japanese,
							都道府県番号:
								schoolCodeDetail.prefectureNumber.prefecturesJaShort,
							設置区分: schoolCodeDetail.institutionOwnership.japanese,
							本分校: conversionSchoolStatus(
								Number(removeParenthesizedValue(data.本分校)),
							),
							移行後の学校コード: data.移行後の学校コード
								? schoolCodeAnalysis(data.移行後の学校コード.slice(0, 13))
										.schoolCode
								: null,
						});
					})
					.on("end", () => resolve(rows))
					.on("error", reject);
			},
		);

		for (const item of schoolCodeCsvObj) {
			if (
				!(
					item.学校種 === "特別支援学校" ||
					item.学校種 === "小学校" ||
					item.学校種 === "中学校" ||
					item.学校種 === "義務教育学校"
				)
			)
				continue;

			const SpecialNeedsSchool: OutputJson = {
				id: item.学校コード,
				idStartYear: Number(item.属性情報設定年月日.match(/^\d{4}/)?.[0]),
				idEndYear:
					Number(item.属性情報廃止年月日?.match(/^\d{4}/)?.[0]) - 1 || null,
				institutionCategory: item.学校種,
				prefecture: item.都道府県番号,
				name: item.学校名, // .normalize("NFKC"), // 全角英数字を半角にする。
				// address: item.学校所在地,
				// isRecruitmentStopped: Boolean(item.属性情報廃止年月日),
				institutionOwnership: item.設置区分,
				nextId: item.移行後の学校コード,
			};
			outputJson.push(SpecialNeedsSchool);
		}

		console.log(`Import completed!`);
	}

	// JSON文字列に変換（整形あり）
	const json = JSON.stringify(outputJson, null, 4);
	// ファイルに書き込み
	writeFileSync(outputFile, json, "utf-8");
}

function removeParenthesizedValue(value: string) {
	if (!value) {
		return "";
	}

	return value.replace(/\([^)]*\)/g, "");
}

function conversionSchoolStatus(value: number): "本校" | "分校" | "廃校" {
	if (!Number.isInteger(value) && value !== 1 && value !== 2 && value !== 9) {
		throw new Error("未知の値です。: conversionSchoolStatus");
	}

	const list: Record<number, "本校" | "分校" | "廃校"> = {
		1: "本校",
		2: "分校",
		9: "廃校",
	};

	if (list[value]) {
		return list[value];
	}

	throw new Error(`未知の値です。(conversionSchoolStatus): ${value}`);
}
