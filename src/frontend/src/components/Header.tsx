import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Sparkles, Loader2 } from 'lucide-react';

export default function Header() {
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-chart-1 to-chart-2 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-chart-1 to-chart-2 bg-clip-text text-transparent">
              Sorare Portfolio-Tracker
            </h1>
            {isAuthenticated && userProfile && (
              <p className="text-xs text-muted-foreground">Hallo, {userProfile.name}</p>
            )}
          </div>
        </div>

        <Button onClick={handleAuth} disabled={isLoggingIn} variant={isAuthenticated ? 'outline' : 'default'}>
          {isLoggingIn ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Anmeldung läuft...
            </>
          ) : isAuthenticated ? (
            <>
              <LogOut className="w-4 h-4 mr-2" />
              Abmelden
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4 mr-2" />
              Anmelden
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
