import { useContext } from 'react';
import { SearchContext } from '../contexts/SearchContextObject';

export function useSearch() {
  return useContext(SearchContext);
}
