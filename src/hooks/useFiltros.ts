'use client';

import { useState, useCallback } from 'react';
import { FiltrosDashboard, StatusLancamento } from '@/types/financeiro';
import { getPresetPeriodo } from '@/lib/date';

const DEFAULT_FILTROS: FiltrosDashboard = {
  periodo: getPresetPeriodo('mes_atual'),
  preset: 'mes_atual',
  regime: 'competencia',
  centrosCusto: [],
  categorias: [],
  metodos: [],
  status: [],
};

export function useFiltros() {
  const [filtros, setFiltros] = useState<FiltrosDashboard>(DEFAULT_FILTROS);

  const setPreset = useCallback((preset: FiltrosDashboard['preset']) => {
    setFiltros((prev) => ({
      ...prev,
      preset,
      periodo: getPresetPeriodo(preset),
    }));
  }, []);

  const setPeriodo = useCallback((inicio: string, fim: string) => {
    setFiltros((prev) => ({ ...prev, periodo: { inicio, fim }, preset: 'custom' }));
  }, []);

  const setRegime = useCallback((regime: FiltrosDashboard['regime']) => {
    setFiltros((prev) => ({ ...prev, regime }));
  }, []);

  const setBusca = useCallback((busca: string) => {
    setFiltros((prev) => ({ ...prev, busca }));
  }, []);

  const setNatureza = useCallback((natureza?: 'fixo' | 'variavel') => {
    setFiltros((prev) => ({ ...prev, natureza }));
  }, []);

  const setCategoriaFiltro = useCallback((catId: string) => {
    setFiltros((prev) => ({
      ...prev,
      categorias: prev.categorias.includes(catId)
        ? prev.categorias.filter((c) => c !== catId)
        : [...prev.categorias, catId],
    }));
  }, []);

  const resetFiltros = useCallback(() => {
    setFiltros(DEFAULT_FILTROS);
  }, []);

  return {
    filtros,
    setPreset,
    setPeriodo,
    setRegime,
    setBusca,
    setNatureza,
    setCategoriaFiltro,
    resetFiltros,
    setFiltros,
  };
}
