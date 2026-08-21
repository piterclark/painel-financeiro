'use client';

import { useCallback } from 'react';
import type { DescricaoSugestao } from '@/services/sugestoes.service';

interface Props {
  items: DescricaoSugestao[];
  activeIndex: number;
  query: string;
  onSelect: (item: DescricaoSugestao) => void;
  onMouseEnter: (index: number) => void;
}

function highlight(text: string, query: string) {
  if (!query.trim()) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-violet-400 font-medium">
        {text.slice(idx, idx + query.trim().length)}
      </span>
      {text.slice(idx + query.trim().length)}
    </>
  );
}

export function AutocompleteDropdown({ items, activeIndex, query, onSelect, onMouseEnter }: Props) {
  const refCallback = useCallback(
    (el: HTMLLIElement | null, index: number) => {
      if (el && index === activeIndex) {
        el.scrollIntoView({ block: 'nearest' });
      }
    },
    [activeIndex],
  );

  return (
    <ul
      className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#1a1f2e] border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto py-1"
      role="listbox"
    >
      {items.map((item, i) => (
        <li
          key={item.descricao}
          ref={(el) => refCallback(el, i)}
          role="option"
          aria-selected={i === activeIndex}
          onMouseDown={(e) => {
            e.preventDefault(); // prevent input blur
            onSelect(item);
          }}
          onMouseEnter={() => onMouseEnter(i)}
          className={`px-3 py-2 text-xs cursor-pointer truncate ${
            i === activeIndex
              ? 'bg-violet-600/20 text-white'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          {highlight(item.descricao, query)}
        </li>
      ))}
    </ul>
  );
}
