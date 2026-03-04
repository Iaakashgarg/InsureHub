export interface ISseEvent<T = unknown> {
  id: string;
  type: string;
  data: T;
  timestamp: number;
  source: string;
  retry?: number;
}
