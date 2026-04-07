import {api} from './api';

export interface SearchResult {
  id: number;
  name: string;
  score: number;
  [key: string]: any;
}

export const semanticSearch = async (
  query: string,
  type: 'products' | 'clients' = 'products',
): Promise<SearchResult[]> => {
  const { data } = await api.get('/search', { params: { q: query, type } });
  return data;
};