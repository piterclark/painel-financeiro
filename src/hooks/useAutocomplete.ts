import { useEffect, useMemo, useState } from 'react';
import type { DescricaoSugestao } from '@/services/sugestoes.service';

export function useAutocomplete(
  suggestions: DescricaoSugestao[],
  query: string,
  maxItems = 8,
) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return suggestions
      .filter((s) => s.descricao.toLowerCase().includes(q))
      .slice(0, maxItems);
  }, [suggestions, query, maxItems]);

  // Reset selection when item list changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [items]);

  const isOpen = open && items.length > 0;

  function openDropdown() {
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(
    e: React.KeyboardEvent,
    onSelect: (item: DescricaoSugestao) => void,
  ) {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      onSelect(items[activeIndex]);
    }
  }

  return {
    items,
    isOpen,
    activeIndex,
    setActiveIndex,
    openDropdown,
    close,
    handleKeyDown,
  };
}
