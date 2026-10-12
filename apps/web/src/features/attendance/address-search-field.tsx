'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { searchAddress, type GeocodeResult } from './geocode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * A standalone (non-react-hook-form) address lookup: resolves a typed
 * address to coordinates via Nominatim and hands the pick to the parent,
 * which writes it into the actual latitude/longitude form fields. Kept
 * separate from those fields since a search can return several candidates
 * for one query, and manual lat/lng entry must stay available as a fallback.
 */
export function AddressSearchField({ onSelect }: { onSelect: (result: GeocodeResult) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSearch() {
    if (!query.trim() || isSearching) {
      return;
    }
    setIsSearching(true);
    setResults([]);
    try {
      const found = await searchAddress(query);
      if (found.length === 0) {
        toast.error('No matching address found — try a more specific search, or enter coordinates manually below');
      }
      setResults(found);
    } catch {
      toast.error('Address lookup failed — enter coordinates manually below instead');
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>Find by address (optional)</Label>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="123 Main St, Accra"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={handleSearch} disabled={isSearching}>
          <Search className="size-4" />
          {isSearching ? 'Searching…' : 'Search'}
        </Button>
      </div>
      {results.length > 0 && (
        <div className="divide-y rounded-md border">
          {results.map((result, index) => (
            <button
              key={index}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                onSelect(result);
                setResults([]);
                setQuery(result.displayName);
              }}
            >
              {result.displayName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
