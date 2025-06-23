export interface FilterApiResponse {
  data: FilterData;
}

export interface FilterData {
  categories: FiltersCategory[];
}

export interface FiltersCategory {
  categoryName: string;
  categoryId: string;
  categoryData: CategoryGroup[];
}

export interface CategoryGroup {
  group?: string;
  data: FilterItem[];
}

export interface FilterItem {
  id: string;
  filterLabel: string;
  cardLabel?: string;
  color?: string;
  icon?: string;
}
