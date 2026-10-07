import { useMemo, useState } from 'react';
import type { Repository } from '@/types/github';
import { filterAndSortRepos, getUniqueLanguages } from '@/lib/stats';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export function useRepoFilter(repos: Repository[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [sortBy, setSortBy] = useState('updated');

  const debouncedQuery = useDebouncedValue(searchQuery, 250);

  const uniqueLanguages = useMemo(() => getUniqueLanguages(repos), [repos]);

  const filteredRepos = useMemo(
    () => filterAndSortRepos(repos, debouncedQuery, selectedLanguage, sortBy),
    [repos, debouncedQuery, selectedLanguage, sortBy],
  );

  return {
    searchQuery,
    setSearchQuery,
    selectedLanguage,
    setSelectedLanguage,
    sortBy,
    setSortBy,
    uniqueLanguages,
    filteredRepos,
  };
}
