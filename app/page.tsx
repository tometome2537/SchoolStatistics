"use client";

import { use, useEffect, useState } from "react";
import type { OutputJson } from "@/types/OutputJson";
import type { SchoolTypeJa } from "@/types/schoolCode";
import { SCHOOL_TYPES_JA } from "@/types/schoolCode";

const DEFAULT_START_YEAR = 2020;
const UNIVERSITY_START_YEAR = 2021;
const END_YEAR = 2026;

function getStartYear(schoolType: SchoolTypeJa): number {
	return schoolType === "大学" ||
		schoolType === "短期大学" ||
		schoolType === "高等専門学校"
		? UNIVERSITY_START_YEAR
		: DEFAULT_START_YEAR;
}

type YearlyChange = {
	year: number;
	openedSchools: OutputJson[];
	closedSchools: OutputJson[];
	netChange: number;
	yearOverYearPercent: number | null;
	active: number;
};

function getYearlyChanges(
	schools: OutputJson[],
	schoolType: SchoolTypeJa,
): YearlyChange[] {
	const startYear = getStartYear(schoolType);
	const selectedSchools = schools.filter(
		(school) => school.institutionCategory === schoolType,
	);

	return Array.from({ length: END_YEAR - startYear + 1 }, (_, index) => {
		const year = startYear + index;
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
		const previousActive = selectedSchools.filter(
			(school) =>
				school.idStartYear < year &&
				(school.idEndYear === null || school.idEndYear >= year),
		).length;
		const netChange = openedSchools.length - closedSchools.length;

		return {
			year,
			openedSchools,
			closedSchools,
			netChange,
			yearOverYearPercent:
				year === startYear || previousActive === 0
					? null
					: (netChange / previousActive) * 100,
			active,
		};
	});
}

export default function Home({
	searchParams,
}: {
	searchParams: Promise<{ schoolType?: string }>;
}) {
	const requestedType = use(searchParams).schoolType;
	const schoolType =
		SCHOOL_TYPES_JA.find((type) => type === requestedType) ?? "小学校";
	const [schools, setSchools] = useState<OutputJson[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const controller = new AbortController();
		setIsLoading(true);
		setError(null);

		void fetch(`/api/schools?schoolType=${encodeURIComponent(schoolType)}`, {
			signal: controller.signal,
		})
			.then((response) => {
				if (!response.ok) throw new Error("学校データを取得できませんでした。");
				return response.json() as Promise<OutputJson[]>;
			})
			.then(setSchools)
			.catch(() => {
				if (!controller.signal.aborted) {
					setError(
						"学校データを取得できませんでした。時間をおいて再度お試しください。",
					);
				}
			})
			.finally(() => {
				if (!controller.signal.aborted) setIsLoading(false);
			});

		return () => controller.abort();
	}, [schoolType]);

	const startYear = getStartYear(schoolType);
	const yearlyChanges = getYearlyChanges(schools, schoolType);
	const schoolById = new Map(schools.map((school) => [school.id, school]));

	return (
		<main className="page-shell">
			<header className="hero">
				<h2>{schoolType}の増減</h2>
			</header>
			<nav className="school-type-nav" aria-label="学校種別">
				{SCHOOL_TYPES_JA.map((type) => (
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
			{isLoading && <p role="status">学校データを取得しています...</p>}
			{error && <p role="alert">{error}</p>}
			{!isLoading && !error && (
				<>
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
										<th scope="col">前年比</th>
										<th scope="col">学校数</th>
									</tr>
								</thead>
								<tbody>
									{yearlyChanges.map((change) => (
										<tr key={change.year}>
											<th scope="row">
												{change.year}年
												{change.year === startYear && (
													<span className="baseline-label">基準</span>
												)}
											</th>
											{change.year === startYear ? (
												<>
													<td className="not-applicable">-</td>
													<td className="not-applicable">-</td>
													<td className="not-applicable">-</td>
													<td className="not-applicable">-</td>
												</>
											) : (
												<>
													<td className="opened">
														+{change.openedSchools.length}
													</td>
													<td
														className={
															change.year === END_YEAR
																? "not-applicable"
																: "closed"
														}
													>
														{change.year === END_YEAR
															? "計測中"
															: `-${change.closedSchools.length}`}
													</td>
													<td
														className={
															change.year === END_YEAR
																? "not-applicable"
																: change.netChange >= 0
																	? "positive"
																	: "negative"
														}
													>
														{change.year === END_YEAR
															? "計測中"
															: `${change.netChange >= 0 ? "+" : ""}${change.netChange}`}
													</td>
													<td
														className={
															change.year === END_YEAR ||
															change.yearOverYearPercent === null
																? "not-applicable"
																: change.yearOverYearPercent >= 0
																	? "positive"
																	: "negative"
														}
													>
														{change.year === END_YEAR
															? "計測中"
															: change.yearOverYearPercent === null
																? "-"
																: `${change.yearOverYearPercent >= 0 ? "+" : ""}${change.yearOverYearPercent.toFixed(1)}%`}
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

					<section
						className="details-section"
						aria-labelledby="details-heading"
					>
						<div className="section-heading">
							<div>
								<h3 id="details-heading">新設・廃校になった学校</h3>
							</div>
						</div>
						<div className="details-list">
							{yearlyChanges
								.filter((change) => change.year !== startYear)
								.map((change) => (
									<details className="year-details" key={change.year}>
										<summary>
											<strong>{change.year}年</strong>
											<span>
												新設{" "}
												<b className="opened">{change.openedSchools.length}</b>
												校<span className="summary-divider">/</span> 廃校{" "}
												<b className="closed">{change.closedSchools.length}</b>
												校
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
				</>
			)}
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
