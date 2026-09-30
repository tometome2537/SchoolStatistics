import output2026Json from "@/public/output2026.json";
import type { OutputJson } from "@/types/OutputJson";
import type { SchoolTypeJa } from "@/types/schoolCode";

export function GET(request: Request) {
	const schoolType: SchoolTypeJa = new URL(request.url).searchParams.get(
		"schoolType",
	) as SchoolTypeJa;

	const schools = (output2026Json as OutputJson[]).filter(
		(school) => school.institutionCategory === schoolType,
	);

	return Response.json(schools);
}
