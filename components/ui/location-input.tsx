"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Location } from "@carbon/icons-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TransactionLocation } from "@/types/TransactionLocation";

interface MapboxSuggestion {
  mapboxId: string;
  name: string;
  address: string;
}

interface LocationInputProps {
  value: TransactionLocation | null;
  onChange: (location: TransactionLocation | null) => void;
  placeholder?: string;
}

export function LocationInput({
  value,
  onChange,
  placeholder = "Search for a place...",
}: LocationInputProps) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const fallbackId = useId();
  const sessionTokenRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : fallbackId
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes to query display
  useEffect(() => {
    setQuery(value?.name ?? "");
  }, [value]);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q,
        session_token: sessionTokenRef.current,
      });

      const res = await fetch(`/api/mapbox/suggest?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
        setIsOpen((data.suggestions ?? []).length > 0);
        setActiveIndex(-1);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    // If the user clears the input, clear the location
    if (!val) {
      onChange(null);
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // If the value changed from what was selected, clear the structured data
    if (value && val !== value.name) {
      onChange(null);
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = async (suggestion: MapboxSuggestion) => {
    setIsOpen(false);
    setQuery(suggestion.name);
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        id: suggestion.mapboxId,
        session_token: sessionTokenRef.current,
      });

      const res = await fetch(`/api/mapbox/retrieve?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        onChange(data.location);
        setQuery(data.location.name);
      }
    } finally {
      setIsLoading(false);
      // Reset session token after a successful retrieval (Mapbox billing)
      sessionTokenRef.current =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Location className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={cn("pl-9", value && "border-green-600/40")}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <ul className="py-1" role="listbox">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.mapboxId}
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  "cursor-pointer px-3 py-2 text-sm hover:bg-accent",
                  index === activeIndex && "bg-accent"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(suggestion)}
              >
                <div className="font-medium">{suggestion.name}</div>
                {suggestion.address && (
                  <div className="text-xs text-muted-foreground truncate">
                    {suggestion.address}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
