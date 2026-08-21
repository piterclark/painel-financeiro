'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/context/AuthContext';

type Aba = 'entrar' | 'cadastrar';

function traduzirErro(msg: string): string {
  if (msg.includes('Invalid login credentials'))  return 'E-mail ou senha incorretos.';
  if (msg.includes('Email not confirmed'))         return 'Confirme seu e-mail antes de entrar.';
  if (msg.includes('User already registered'))     return 'Este e-mail já está cadastrado.';
  if (msg.includes('Password should be'))          return 'A senha deve ter pelo menos 6 caracteres.';
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Muitas tentativas. Aguarde alguns minutos.';
  if (msg.includes('Unable to validate'))          return 'E-mail inválido.';
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

export default function LoginPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const [aba, setAba] = useState<Aba>('entrar');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);

  useEffect(() => {
    if (!authLoading && session) router.replace('/dashboard');
  }, [session, authLoading, router]);

  function trocarAba(nova: Aba) {
    setAba(nova);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  }

  async function handleEntrar(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(traduzirErro(err.message)); setLoading(false); }
    // sucesso → onAuthStateChange dispara → context atualiza → useEffect redireciona
  }

  async function handleCadastrar(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({ email, password });

    if (err) {
      setError(traduzirErro(err.message));
      setLoading(false);
      return;
    }

    // Supabase requer confirmação de e-mail → session é null
    if (!data.session) {
      setEmailEnviado(true);
      setLoading(false);
      return;
    }

    // Confirmação desabilitada → já está logado. Seed das categorias padrão.
    await supabase.rpc('seed_categorias_padrao', { p_user_id: data.user!.id });
    // onAuthStateChange redireciona para /dashboard automaticamente
  }

  if (authLoading) return null;

  // ── Tela de confirmação de e-mail ──────────────────────────────────────────
  if (emailEnviado) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="text-5xl">📬</div>
          <div>
            <h2 className="text-xl font-bold text-white">Verifique seu e-mail</h2>
            <p className="text-sm text-slate-400 mt-2">
              Enviamos um link de confirmação para{' '}
              <span className="text-white font-medium">{email}</span>.
              Clique no link para ativar sua conta.
            </p>
          </div>
          <p className="text-xs text-slate-600">
            Não recebeu? Verifique a pasta de spam.
          </p>
          <button
            onClick={() => { setEmailEnviado(false); trocarAba('entrar'); }}
            className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            ← Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  // ── Formulário principal ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Painel Financeiro</h1>
          <p className="text-sm text-slate-500 mt-1">
            {aba === 'entrar' ? 'Acesse sua conta' : 'Crie sua conta gratuitamente'}
          </p>
        </div>

        {/* Alternador de aba */}
        <div className="flex bg-[#1a1f2e] border border-white/5 rounded-xl p-1 mb-4">
          {(['entrar', 'cadastrar'] as Aba[]).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => trocarAba(a)}
              className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${
                aba === a
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {a === 'entrar' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>

        <form
          onSubmit={aba === 'entrar' ? handleEntrar : handleCadastrar}
          className="bg-[#1a1f2e] border border-white/5 rounded-xl p-6 space-y-4"
        >
          {/* E-mail */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">E-mail</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="seu@email.com"
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Senha</label>
            <input
              type="password"
              required
              autoComplete={aba === 'entrar' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
              placeholder={aba === 'cadastrar' ? 'Mínimo 8 caracteres' : '••••••••'}
            />
          </div>

          {/* Confirmar senha (só no cadastro) */}
          {aba === 'cadastrar' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Confirmar senha
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="Repita a senha"
              />
            </div>
          )}

          {/* Erro */}
          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg py-2.5 transition-colors"
          >
            {loading
              ? aba === 'entrar' ? 'Entrando...' : 'Criando conta...'
              : aba === 'entrar' ? 'Entrar'      : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  );
}
