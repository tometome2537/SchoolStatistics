import type {
	InstitutionOwnershipJa,
	PrefecturesJaShort,
	SchoolTypeJa,
} from "@/types/schoolCode";

export type OutputJson = {
	id: string;
	idStartYear: number;
	idEndYear: number | null;
	institutionCategory: SchoolTypeJa;
	prefecture: PrefecturesJaShort;
	name: string;
	address: string;
	isRecruitmentStopped: boolean;
	institutionOwnership: InstitutionOwnershipJa;
	nextId: string | null;
};
