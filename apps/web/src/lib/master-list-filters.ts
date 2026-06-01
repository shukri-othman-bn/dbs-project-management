export type MasterListFilterState = {
  search: string;
  unit: string;
  vote: string;
  contractor: string;
  projectType: string;
  projectStatus: string;
  ministry: string;
  department: string;
};

export const EMPTY_MASTER_LIST_FILTERS: MasterListFilterState = {
  search: "",
  unit: "",
  vote: "",
  contractor: "",
  projectType: "",
  projectStatus: "",
  ministry: "",
  department: "",
};

export function countActiveMasterListFilters(filters: MasterListFilterState) {
  return [
    filters.unit,
    filters.vote,
    filters.contractor,
    filters.projectType,
    filters.projectStatus,
    filters.ministry,
    filters.department,
  ].filter(Boolean).length;
}
