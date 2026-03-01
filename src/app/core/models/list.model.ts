export interface PurchaseList {
  id: string;
  family_id: string;
  owner_id: string;
  name: string;
  description: string | null;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
  owner?: {
    display_name: string;
    avatar_url: string | null;
  };
  item_count?: number;
  total_estimated?: number;
}

export interface CreateListDto {
  family_id: string;
  name: string;
  description?: string;
  is_shared: boolean;
}
