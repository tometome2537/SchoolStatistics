import output2026Json from "@/public/output2026.json";
import type { OutputJson } from "@/types/OutputJson";

const START_YEAR = 2020;
const END_YEAR = 2026;
const SCHOOL_TYPES = [
	"小学校",
	"中学校",
	"義務教育学校",
	"特別支援学校",
] as const;
type SupportedSchoolType = (typeof SCHOOL_TYPES)[number];

type YearlyChange = {
	year: number;
	openedSchools: OutputJson[];
	closedSchools: OutputJson[];
	netChange: number;
	active: number;
};

function getYearlyChanges(
	schools: OutputJson[],
	schoolType: SupportedSchoolType,
): YearlyChange[] {
	const selectedSchools = schools.filter(
		(school) => school.institutionCategory === schoolType,
	);

	return Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, index) => {
		const year = START_YEAR + index;
		const openedSchools = selectedSchools.filter(
			(school) => school.idStartYear === year,
		);
		const closedSchools = selectedSchools.filter(
			(school) => school.idEndYear === year,
		);
		const active = selectedSchools.filter(
			(school) =>
				school.idStartYear <= year &&
				(school.idEndYear === null || school.idEndYear > year),
		).length;

		return {
			year,
			openedSchools,
			closedSchools,
			netChange: openedSchools.length - closedSchools.length,
			active,
		};
	});
}

export default async function Home({
	searchParams,
}: {
	searchParams: Promise<{ schoolType?: string }>;
}) {
	const requestedType = (await searchParams).schoolType;
	const schoolType =
		SCHOOL_TYPES.find((type) => type === requestedType) ?? "小学校";
	const schools = output2026Json as OutputJson[];
	const yearlyChanges = getYearlyChanges(schools, schoolType);
	const schoolById = new Map(schools.map((school) => [school.id, school]));
	const predecessorsById = new Map<string, OutputJson[]>();
	for (const school of schools) {
		if (!school.nextId) continue;
		const predecessors = predecessorsById.get(school.nextId) ?? [];
		predecessors.push(school);
		predecessorsById.set(school.nextId, predecessors);
	}

	return (
		<main className="page-shell">
			<header className="hero">
				<h2>{schoolType}の増減</h2>
			</header>
			<nav className="school-type-nav" aria-label="学校種別">
				{SCHOOL_TYPES.map((type) => (
					<a
						aria-current={schoolType === type ? "page" : undefined}
						href={`/?schoolType=${encodeURIComponent(type)}`}
						key={type}
					>
						{type}
					</a>
				))}
			</nav>
			{schoolType === "義務教育学校" && (
				<p className="note">
					義務教育学校とは、小学校と中学校の課程を一体化し、前期課程（1〜6年）・後期課程（7〜9年）の9年間を通して義務教育を行う学校です。
				</p>
			)}

			<section className="trend-section" aria-labelledby="trend-heading">
				<div className="section-heading">
					<div>
						<h3 id="trend-heading">年ごとの変化</h3>
					</div>
				</div>
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th scope="col">年</th>
								<th scope="col">新設</th>
								<th scope="col">廃校</th>
								<th scope="col">純増減</th>
								<th scope="col">学校数</th>
							</tr>
						</thead>
						<tbody>
							{yearlyChanges.map((change) => (
								<tr key={change.year}>
									<th scope="row">
										{change.year}年
										{change.year === START_YEAR && (
											<span className="baseline-label">基準</span>
										)}
									</th>
									{change.year === START_YEAR ? (
										<>
											<td className="not-applicable">-</td>
											<td className="not-applicable">-</td>
											<td className="not-applicable">-</td>
										</>
									) : (
										<>
											<td className="opened">+{change.openedSchools.length}</td>
											<td className="closed">-{change.closedSchools.length}</td>
											<td
												className={
													change.netChange >= 0 ? "positive" : "negative"
												}
											>
												{change.netChange >= 0 ? "+" : ""}
												{change.netChange}
											</td>
										</>
									)}
									<td className="active-count">
										{change.active.toLocaleString()}校
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			<section className="details-section" aria-labelledby="details-heading">
				<div className="section-heading">
					<div>
						<h3 id="details-heading">新設・廃校になった学校</h3>
					</div>
				</div>
				<div className="details-list">
					{yearlyChanges
						.filter((change) => change.year !== START_YEAR)
						.map((change) => (
							<details className="year-details" key={change.year}>
								<summary>
									<strong>{change.year}年</strong>
									<span>
										新設 <b className="opened">{change.openedSchools.length}</b>
										校<span className="summary-divider">/</span> 廃校{" "}
										<b className="closed">{change.closedSchools.length}</b>校
									</span>
								</summary>
								<div className="school-columns">
									<SchoolList
										title="新設校"
										schools={change.openedSchools}
										tone="opened"
										schoolById={schoolById}
									/>
									<SchoolList
										title="廃校"
										schools={change.closedSchools}
										tone="closed"
										schoolById={schoolById}
									/>
								</div>
							</details>
						))}
				</div>
			</section>
		</main>
	);
}

function SchoolList({
	title,
	schools,
	tone,
	schoolById,
}: {
	title: string;
	schools: OutputJson[];
	tone: "opened" | "closed";
	schoolById: Map<string, OutputJson>;
}) {
	return (
		<div className="school-list">
			<h3 className={tone}>{title}</h3>
			{schools.length === 0 ? (
				<p className="empty-list">該当なし</p>
			) : (
				<ul>
					{schools.map((school) => (
						<li key={school.id}>
							<div>
								<strong>{school.name}</strong>
								{school.nextId && (
									<span className="successor">
										移行先:{" "}
										{schoolById.get(school.nextId)?.name ?? school.nextId}
									</span>
								)}
							</div>
							<span>{school.prefecture}</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
