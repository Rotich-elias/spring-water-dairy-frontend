export interface Animal {
  id: number;
  client_uuid?: string;
  ear_tag: string;
  name?: string;
  sex: "M" | "F";
  birth_date?: string;
  category_id: number;
  category?: string;
  pen_id?: number;
  pen?: string;
  status_id?: number;
  status?: string;
  breed_id?: number;
  breed?: string;
  age?: number;
  parity?: number;
  days_in_milk?: number;
  in_withholding: boolean;
  reproductive_status: string;
  exit_date?: string;
  exit_reason?: string;
  exit_price?: number;
  dam_id?: number;
  sire_id?: number;
  version: number;
  created_at?: string;
  updated_at?: string;
}
