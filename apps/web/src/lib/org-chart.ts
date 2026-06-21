import { UNIT_CODES } from "./units";

/** Leadership tiers above the project units (top → bottom). */
export const PROJECT_ORG_LEADERSHIP = [
  { id: "director", title: "Director" },
  { id: "assistant-director", title: "Assistant Director" },
  { id: "head-of-section", title: "Head of Section" },
  { id: "executive-engineer", title: "Executive Engineer" },
] as const;

/** Units on the org chart: BM1–BM10, IMU1–IMU3, plus UMR and UAB. */
export const PROJECT_ORG_UNIT_CODES = UNIT_CODES;

export type ProjectOrgUnitCode = (typeof PROJECT_ORG_UNIT_CODES)[number];

/** Each unit has a Head of Unit (sign-in) and project-level OICs (name + email per project). */
export const PROJECT_ORG_UNIT_NOTE =
  "Each unit is led by a Head of Unit (govt email for sign-in). Project OICs are entered per project.";
