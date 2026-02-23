import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface UseAnmatAIReturn {
  output: string;
  loading: boolean;
  error: string | null;
  generate: (tool: string, userMessage: string) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export function useAnmatAI(): UseAnmatAIReturn {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    setOutput('');
    setError(null);
    setLoading(false);
  }, []);

  const generate = useCallback(async (tool: string, userMessage: string) => {
    cancel();
    setOutput('');
    setError(null);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Get the session token for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/anmat-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({ tool, userMessage }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errData.error || `Error ${response.status}`);
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No se pudo leer la respuesta');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              setOutput(prev => prev + content);
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Error al generar documento');
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [cancel]);

  return { output, loading, error, generate, cancel, reset };
}
