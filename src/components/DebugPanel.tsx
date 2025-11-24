import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { X, RefreshCw } from 'lucide-react';

export const DebugPanel = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    updateDebugInfo();
  }, []);

  const updateDebugInfo = () => {
    const info = {
      envVars: {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'MISSING',
        VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'SET' : 'MISSING',
        VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID || 'MISSING',
      },
      allEnvVars: Object.keys(import.meta.env).join(', '),
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
    };
    setDebugInfo(info);
  };

  const runTests = async () => {
    const results: string[] = [];
    
    // Test 1: Check auth
    try {
      const { data, error } = await supabase.auth.getSession();
      results.push(error ? `❌ Auth: ${error.message}` : `✅ Auth: Session ${data.session ? 'exists' : 'none'}`);
    } catch (err) {
      results.push(`❌ Auth: ${err}`);
    }

    // Test 2: Check database
    try {
      const { data, error } = await supabase.from('surveys').select('id').limit(1);
      results.push(error ? `❌ DB: ${error.message}` : `✅ DB: Connected (${data?.length || 0} surveys)`);
    } catch (err) {
      results.push(`❌ DB: ${err}`);
    }

    // Test 3: Check user roles
    try {
      const { data, error } = await supabase.from('user_roles').select('role').limit(1);
      results.push(error ? `❌ Roles: ${error.message}` : `✅ Roles: Accessible`);
    } catch (err) {
      results.push(`❌ Roles: ${err}`);
    }

    setTestResults(results);
  };

  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 max-w-md p-4 bg-destructive/10 border-destructive text-xs">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-bold text-destructive">🔍 Debug Panel</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div>
          <strong>Environment:</strong>
          <div className="ml-2 font-mono">
            <div>Mode: {debugInfo.mode}</div>
            <div>Dev: {String(debugInfo.dev)}</div>
            <div>Prod: {String(debugInfo.prod)}</div>
          </div>
        </div>

        <div>
          <strong>Supabase Config:</strong>
          <div className="ml-2 font-mono">
            <div className={debugInfo.envVars?.VITE_SUPABASE_URL !== 'MISSING' ? 'text-green-600' : 'text-destructive'}>
              URL: {debugInfo.envVars?.VITE_SUPABASE_URL}
            </div>
            <div className={debugInfo.envVars?.VITE_SUPABASE_PUBLISHABLE_KEY === 'SET' ? 'text-green-600' : 'text-destructive'}>
              Key: {debugInfo.envVars?.VITE_SUPABASE_PUBLISHABLE_KEY}
            </div>
            <div className={debugInfo.envVars?.VITE_SUPABASE_PROJECT_ID !== 'MISSING' ? 'text-green-600' : 'text-destructive'}>
              Project: {debugInfo.envVars?.VITE_SUPABASE_PROJECT_ID}
            </div>
          </div>
        </div>

        <div>
          <strong>All Env Vars:</strong>
          <div className="ml-2 font-mono text-[10px] break-all">
            {debugInfo.allEnvVars || 'None'}
          </div>
        </div>

        <Button
          onClick={runTests}
          size="sm"
          variant="outline"
          className="w-full gap-2"
        >
          <RefreshCw className="h-3 w-3" />
          Run Connection Tests
        </Button>

        {testResults.length > 0 && (
          <div className="mt-2">
            <strong>Test Results:</strong>
            <div className="ml-2 font-mono space-y-1">
              {testResults.map((result, i) => (
                <div key={i}>{result}</div>
              ))}
            </div>
          </div>
        )}

        <div className="text-[10px] opacity-70 mt-2">
          Check browser console for detailed logs
        </div>
      </div>
    </Card>
  );
};
