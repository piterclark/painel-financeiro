'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { runSeed } from '@/services/seed.service';
import { Database } from 'lucide-react';

export default function SeedPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !session) router.replace('/login');
  }, [session, authLoading, router]);

  async function handleSeed() {
    setRunning(true);
    setResult(null);
    const res = await runSeed();
    setResult(res);
    setRunning(false);
  }

  if (authLoading || !session) return null;

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div>
          <Database size={40} className="text-violet-400 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-white">Dados de Teste</h1>
          <p className="text-sm text-slate-500 mt-1">
            Popula o banco com 12 meses de lançamentos de exemplo para o usuário logado.
          </p>
        </div>

        <div className="bg-[#1a1f2e] border border-white/5 rounded-xl p-5 space-y-4">
          <ul className="text-xs text-slate-400 text-left space-y-1">
            <li>• Categorias padrão (seed_categorias_padrao)</li>
            <li>• 5 métodos de pagamento</li>
            <li>• 3 centros de custo</li>
            <li>• ~200 lançamentos (12 meses)</li>
            <li>• 8 orçamentos do mês atual</li>
          </ul>

          <button
            onClick={handleSeed}
            disabled={running}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg py-2.5 transition-colors"
          >
            {running ? 'Executando...' : 'Executar Seed'}
          </button>

          {result && (
            <p className={`text-xs rounded-lg px-3 py-2 ${
              result.success
                ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20'
                : 'text-red-400 bg-red-400/10 border border-red-400/20'
            }`}>
              {result.message}
            </p>
          )}
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Voltar ao painel
        </button>
      </div>
    </div>
  );
}
