export interface IQuery {
  id: number;
  name: string;
  group_name: string | null;
  databases_id: number;
  sql: string;
  parameter_map: JSON | null;
  is_query_active: boolean;
  created_at: string;
  updated_at: string;
}
