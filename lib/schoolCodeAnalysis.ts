import { getCalculateSchoolCodeCheckDigit } from "@/lib/schoolCodeCheckDigitCalculation";
import type {
	InstitutionOwnershipEn,
	InstitutionOwnershipJa,
	PrefecturesJaShort,
	SchoolTypeEn,
	SchoolTypeJa,
} from "@/types/schoolCode";

export type Response = {
	schoolCode: string;
	schoolCodeWithoutCheckDigit: string;
	schoolCodeWithHyphens: string;
	schoolCodeWithoutCheckDigitWithHyphens: string;
	schoolType: {
		value: string;
		japanese: SchoolTypeJa;
		english: SchoolTypeEn;
	};
	prefectureNumber: {
		value: string;
		prefecturesJaShort: PrefecturesJaShort;
	};
	institutionOwnership: {
		value: string;
		japanese: InstitutionOwnershipJa;
		english: InstitutionOwnershipEn;
	};
	schoolNumber: {
		value: string;
	};
	checkDigit: string | null;
	calculateCheckDigit: string;
};

/**
 * 学校コードを解析する
 * ⚠️ 過去に文科省が公開した学校コードに誤りがあれば、修正したものを出力する。
 *
 * @param value 学校コード
 * @returns 学校コードの解析結果
 */
export function schoolCodeAnalysis(value: string): Response {
	const normalizeSchoolCode: string = value
		.normalize("NFKC") // 全角英数字は半角英数字に変換。
		.toUpperCase() // 小文字を大文字に変換。
		.replace(/[^A-Z0-9]/g, ""); // 学校コードに関係のない文字を削除。

	if (normalizeSchoolCode.length !== 13) {
		if (normalizeSchoolCode.length === 12) {
			console.warn(
				`警告: 学校コードは本来13桁です。入力された値は末尾の検査数字が欠損している可能性があります。${normalizeSchoolCode}`,
			);
		} else {
			throw new Error(
				`エラー: 学校コードは13桁、または12桁で定義してください。${value}`,
			);
		}
	}

	const schoolType: string = normalizeSchoolCode.slice(0, 2);
	const prefectureNumber: string = normalizeSchoolCode.slice(2, 4);
	const institutionOwnership: string = normalizeSchoolCode.slice(4, 5);
	const schoolNumber: string = normalizeSchoolCode.slice(5, 12);
	const checkDigit: string | null = normalizeSchoolCode.slice(12, 13) || null;

	const calculateCheckDigit: string =
		getCalculateSchoolCodeCheckDigit(normalizeSchoolCode);

	if (checkDigit && checkDigit !== calculateCheckDigit) {
		console.warn(
			`エラー: 検査数値が異常です。学校コード[${normalizeSchoolCode}]受け取った値${checkDigit} ,計算した値${calculateCheckDigit} `,
		);
		// throw new Error(
		// 	`エラー: 検査数値が異常です。学校コード[${normalizeSchoolCode}]受け取った値${checkDigit} ,計算した値${calculateCheckDigit} `,
		// );
	}

	return {
		schoolCode: `${schoolType}${prefectureNumber}${institutionOwnership}${schoolNumber}${calculateCheckDigit}`,
		schoolCodeWithoutCheckDigit: `${schoolType}${prefectureNumber}${institutionOwnership}${schoolNumber}`,
		schoolCodeWithHyphens: `${schoolType}-${prefectureNumber}-${institutionOwnership}-${schoolNumber}-${calculateCheckDigit}`,
		schoolCodeWithoutCheckDigitWithHyphens: `${schoolType}-${prefectureNumber}-${institutionOwnership}-${schoolNumber}`,
		schoolType: {
			value: schoolType,
			japanese: getSchoolType(schoolType).japanese,
			english: getSchoolType(schoolType).english,
		},
		prefectureNumber: {
			value: prefectureNumber,
			prefecturesJaShort: getPrefectures(Number(prefectureNumber)),
		},
		institutionOwnership: {
			value: institutionOwnership,
			japanese: getInstitutionOwnership(institutionOwnership).japanese,
			english: getInstitutionOwnership(institutionOwnership).english,
		},
		schoolNumber: {
			value: schoolNumber,
		},
		checkDigit: checkDigit,
		calculateCheckDigit,
	};
}

function getSchoolType(value: string): {
	japanese: SchoolTypeJa;
	english: SchoolTypeEn;
} {
	if (value === "A1") {
		return {
			japanese: "幼稚園",
			english: "Kindergarten",
		};
	}
	if (value === "A2") {
		return {
			japanese: "幼保連携型認定こども園",
			english: "CertifiedCenterForEarlyChildhoodEducationAndCare",
		};
	}
	if (value === "B1") {
		return {
			japanese: "小学校",
			english: "ElementarySchool",
		};
	}
	if (value === "C1") {
		return {
			japanese: "中学校",
			english: "JuniorHighSchool",
		};
	}
	if (value === "C2") {
		return {
			japanese: "義務教育学校",
			english: "CompulsoryEducationSchool",
		};
	}
	if (value === "D1") {
		return {
			japanese: "高等学校",
			english: "HighSchool",
		};
	}
	if (value === "D2") {
		return {
			japanese: "中等教育学校",
			english: "SecondarySchool",
		};
	}
	if (value === "E1") {
		return {
			japanese: "特別支援学校",
			english: "SpecialNeedsSchool",
		};
	}
	if (value === "F1") {
		return {
			japanese: "大学",
			english: "University",
		};
	}
	if (value === "F2") {
		return {
			japanese: "短期大学",
			english: "JuniorCollege",
		};
	}
	if (value === "G1") {
		return {
			japanese: "高等専門学校",
			english: "CollegeOfTechnology",
		};
	}
	if (value === "H1") {
		return {
			japanese: "専修学校",
			english: "SpecializedTrainingCollege",
		};
	}
	if (value === "H2") {
		return {
			japanese: "各種学校",
			english: "MiscellaneousSchool",
		};
	}
	throw new Error(`エラー(getSchoolType): 不明な値です。${value}`);
}

function getInstitutionOwnership(value: string): {
	japanese: InstitutionOwnershipJa;
	english: InstitutionOwnershipEn;
} {
	if (value === "1") {
		return {
			japanese: "国立",
			english: "National",
		};
	}
	if (value === "2") {
		return {
			japanese: "公立",
			english: "Public",
		};
	}
	if (value === "3") {
		return {
			japanese: "私立",
			english: "Private",
		};
	}
	throw new Error(`エラー(getInstitutionOwnership): 不明な値です。${value}`);
}

function getPrefectures(value: number): PrefecturesJaShort {
	if (value < 1 || value > 47 || !Number.isInteger(value)) {
		throw new Error("未知の値です。: conversionPrefectures");
	}
	const prefectures: PrefecturesJaShort[] = [
		"北海道",
		"青森",
		"岩手",
		"宮城",
		"秋田",
		"山形",
		"福島",
		"茨城",
		"栃木",
		"群馬",
		"埼玉",
		"千葉",
		"東京",
		"神奈川",
		"新潟",
		"富山",
		"石川",
		"福井",
		"山梨",
		"長野",
		"岐阜",
		"静岡",
		"愛知",
		"三重",
		"滋賀",
		"京都",
		"大阪",
		"兵庫",
		"奈良",
		"和歌山",
		"鳥取",
		"島根",
		"岡山",
		"広島",
		"山口",
		"徳島",
		"香川",
		"愛媛",
		"高知",
		"福岡",
		"佐賀",
		"長崎",
		"熊本",
		"大分",
		"宮崎",
		"鹿児島",
		"沖縄",
	];
	return prefectures[value - 1];
}
