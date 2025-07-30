import React, { useState } from 'react';
import { colors, spacing } from '../styles/theme';
import { Button } from './Button';
import { Input } from './Input';
import type { SearchResult } from '../types';

interface SearchProps {
  onSearch: (query: string) => Promise<SearchResult[]>;
}

export function Search({ onSearch }: SearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const searchResults = await onSearch(query);
      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
      alert("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const SearchIcon = (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path 
        d="M17.5 17.5L14.5834 14.5833M16.6667 9.58333C16.6667 13.4954 13.4954 16.6667 9.58333 16.6667C5.67132 16.6667 2.5 13.4954 2.5 9.58333C2.5 5.67132 5.67132 2.5 9.58333 2.5C13.4954 2.5 16.6667 5.67132 16.6667 9.58333Z" 
        stroke={colors.gray[400]} 
        strokeWidth="1.66667" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div style={styles.container}>
      <form onSubmit={handleSearch} style={styles.searchForm}>
        <div style={styles.searchInputWrapper}>
          <Input
            type="text"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Search for content..."
            disabled={loading}
            icon={SearchIcon}
          />
        </div>
        <Button type="submit" loading={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {results.length > 0 && (
        <div style={styles.results}>
          {results.map((result, index) => (
            <div key={index} style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <div>
                  <h3 style={styles.resultTitle}>{result.scriptTitle}</h3>
                  <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
                    <div style={styles.badge}>
                      <span style={styles.badgeText}>
                        {(result.avgSimilarity * 100).toFixed(1)}% match
                      </span>
                    </div>
                    <div style={{ ...styles.badge, background: colors.gray[800], border: `1px solid ${colors.gray[700]}` }}>
                      <span style={{ ...styles.badgeText, color: colors.gray[300] }}>
                        {result.chunkIndices.length} chunk{result.chunkIndices.length > 1 ? 's' : ''} from script
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <pre style={styles.resultContent}>{result.content}</pre>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && query && !loading && (
        <div style={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: spacing.lg }}>
            <path 
              d="M42 42L35.0001 35M40 22C40 31.9411 31.9411 40 22 40C12.0589 40 4 31.9411 4 22C4 12.0589 12.0589 4 22 4C31.9411 4 40 12.0589 40 22Z" 
              stroke={colors.gray[400]} 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <p style={styles.emptyStateText}>No results found</p>
          <p style={styles.emptyStateSubtext}>Try adjusting your search query</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
  },
  searchForm: {
    display: "flex",
    gap: spacing.md,
    marginBottom: spacing.xxl,
    alignItems: "stretch",
    flexWrap: "nowrap" as const,
  },
  searchInputWrapper: {
    flex: "1 1 auto",
    minWidth: 0,
  },
  results: {
    display: "flex",
    flexDirection: "column" as const,
    gap: spacing.lg,
  },
  resultCard: {
    padding: "20px",
    border: `1px solid ${colors.gray[800]}`,
    borderRadius: "12px",
    background: colors.gray[900],
    transition: "all 0.2s",
  },
  resultHeader: {
    marginBottom: spacing.lg,
  },
  resultTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: colors.gray[100],
    margin: `0 0 ${spacing.sm} 0`,
  },
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "6px",
    background: colors.primary[900],
    border: `1px solid ${colors.primary[700]}`,
  },
  badgeText: {
    fontSize: "12px",
    fontWeight: 500,
    color: colors.primary[200],
  },
  resultContent: {
    margin: 0,
    lineHeight: 1.7,
    color: colors.gray[300],
    whiteSpace: "pre-wrap" as const,
    fontFamily: "'SF Mono', Monaco, Inconsolata, 'Fira Code', monospace",
    fontSize: "14px",
    background: colors.gray[950],
    padding: spacing.lg,
    borderRadius: "8px",
    border: `1px solid ${colors.gray[800]}`,
    overflow: "auto",
  },
  emptyState: {
    textAlign: "center" as const,
    padding: spacing.xxxl,
  },
  emptyStateText: {
    fontSize: "16px",
    fontWeight: 500,
    color: colors.gray[300],
    margin: `0 0 ${spacing.xs} 0`,
  },
  emptyStateSubtext: {
    fontSize: "14px",
    color: colors.gray[500],
    margin: 0,
  },
};