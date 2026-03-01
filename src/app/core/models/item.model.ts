export type ItemStatus = 'pending' | 'in_cart' | 'purchased' | 'cancelled';

export interface Item {
  id: string;
  list_id: string;
  added_by: string;
  name: string;
  description: string | null;
  estimated_price: number | null;
  priority_order: number;
  status: ItemStatus;
  photo_url: string | null;
  purchase_url: string | null;
  store_name: string | null;
  is_purchased: boolean;
  purchased_by: string | null;
  actual_price: number | null;
  purchased_at: string | null;
  created_at: string;
  updated_at: string;
  added_by_profile?: {
    display_name: string;
    avatar_url: string | null;
  };
}

export interface CreateItemDto {
  list_id: string;
  name: string;
  description?: string;
  estimated_price?: number;
  photo_url?: string;
  purchase_url?: string;
  store_name?: string;
}

export interface UpdateItemDto {
  name?: string;
  description?: string;
  estimated_price?: number;
  priority_order?: number;
  status?: ItemStatus;
  photo_url?: string;
  purchase_url?: string;
  store_name?: string;
  is_purchased?: boolean;
  actual_price?: number;
}
