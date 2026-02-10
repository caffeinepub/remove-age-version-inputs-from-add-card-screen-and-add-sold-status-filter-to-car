import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import PortfolioPage from './pages/PortfolioPage';
import CardsPage from './pages/CardsPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useActor } from './hooks/useActor';
import { useActorQueryState } from './hooks/useActorQueryState';
import { useQueryClient } from '@tanstack/react-query';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const { identity, loginStatus, isInitializing, clear } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { isAttemptInProgress, isError: actorQueryIsError, error: actorError, retry: retryActor } = useActorQueryState();
  const queryClient = useQueryClient();
  const { 
    data: userProfile, 
    isLoading: profileLoading, 
    isFetched: profileFetched, 
    error: profileError,
    refetch: refetchProfile 
  } = useGetCallerUserProfile();

  const [actorTimeout, setActorTimeout] = useState(false);
  const [profileTimeout, setProfileTimeout] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';
  
  // Detect actor initialization errors
  const hasActorError = actorQueryIsError;
  
  // Actor timeout: 10 seconds
  useEffect(() => {
    if (isAuthenticated && !actor && (actorFetching || isAttemptInProgress)) {
      console.log('Starting actor timeout timer (10s)');
      const timer = setTimeout(() => {
        if (!actor && !hasActorError) {
          console.error('Actor initialization timeout after 10 seconds');
          setActorTimeout(true);
        }
      }, 10000);
      return () => {
        console.log('Clearing actor timeout timer');
        clearTimeout(timer);
      };
    } else if (actor) {
      setActorTimeout(false);
    }
  }, [isAuthenticated, actorFetching, isAttemptInProgress, actor, hasActorError]);

  // Profile timeout: 15 seconds
  useEffect(() => {
    if (isAuthenticated && actor && !profileFetched && profileLoading) {
      console.log('Starting profile timeout timer (15s)');
      const timer = setTimeout(() => {
        if (!profileFetched) {
          console.error('Profile loading timeout after 15 seconds');
          setProfileTimeout(true);
        }
      }, 15000);
      return () => {
        console.log('Clearing profile timeout timer');
        clearTimeout(timer);
      };
    } else if (profileFetched) {
      setProfileTimeout(false);
    }
  }, [isAuthenticated, actor, profileLoading, profileFetched]);

  // Reset state when authentication changes
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User logged out, resetting all state');
      setProfileTimeout(false);
      setActorTimeout(false);
      setRetryCount(0);
    }
  }, [isAuthenticated]);

  // Log state changes for debugging
  useEffect(() => {
    console.log('App state:', {
      isAuthenticated,
      hasActor: !!actor,
      actorFetching,
      isAttemptInProgress,
      hasActorError,
      actorTimeout,
      profileLoading,
      profileFetched,
      profileError: !!profileError,
      profileTimeout,
      hasProfile: !!userProfile,
    });
  }, [isAuthenticated, actor, actorFetching, isAttemptInProgress, hasActorError, actorTimeout, profileLoading, profileFetched, profileError, profileTimeout, userProfile]);

  // Determine if we should show profile setup modal
  const showProfileSetup = isAuthenticated && !!actor && profileFetched && userProfile === null && !profileError && !profileTimeout;
  
  // Determine if we can show main content
  const canShowMainContent = isAuthenticated && !!actor && (profileFetched || profileError || profileTimeout);

  // Handle retry for actor initialization
  const handleActorRetry = async () => {
    console.log(`Actor retry attempt ${retryCount + 1}`);
    setRetryCount(prev => prev + 1);
    setActorTimeout(false);
    
    try {
      // Use the retry function from the actor query state
      await retryActor();
    } catch (error) {
      console.error('Retry failed:', error);
      // If retry fails, fall back to full reload
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      console.log(`Waiting ${delay}ms before full reload`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log('Clearing cache and reloading...');
      await clear();
      queryClient.clear();
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  // Handle retry for profile loading
  const handleProfileRetry = async () => {
    console.log(`Profile retry attempt ${retryCount + 1}`);
    setRetryCount(prev => prev + 1);
    setProfileTimeout(false);
    
    const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
    console.log(`Waiting ${delay}ms before retry`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    console.log('Refetching profile...');
    await refetchProfile();
  };

  // Handle logout
  const handleLogout = async () => {
    console.log('Logging out...');
    setProfileTimeout(false);
    setActorTimeout(false);
    setRetryCount(0);
    await clear();
    queryClient.clear();
  };

  // Show loading during initialization or login
  if (isInitializing || isLoggingIn) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
          <div className="text-center space-y-4">
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">
              {isLoggingIn ? 'Logging in...' : 'Initializing...'}
            </p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/5">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          {!isAuthenticated ? (
            // Not authenticated - show login prompt
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-6 max-w-md">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-chart-1 to-chart-2 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold">Willkommen beim Sorare Portfolio-Tracker</h1>
                <p className="text-muted-foreground">
                  Verwalte deine Sammelkarten-Investitionen und verfolge deine Gewinne und Verluste.
                </p>
                <p className="text-sm text-muted-foreground">
                  Bitte melde dich an, um fortzufahren.
                </p>
              </div>
            </div>
          ) : hasActorError || actorTimeout ? (
            // Actor initialization error or timeout
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="max-w-md w-full space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Failed to connect</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>
                      The connection to the backend could not be established. This may be due to a slow internet connection or temporary server issues.
                    </p>
                    {actorError && (
                      <p className="text-xs font-mono bg-destructive/10 p-2 rounded mt-2">
                        {actorError instanceof Error ? actorError.message : String(actorError)}
                      </p>
                    )}
                    {actorTimeout && !actorError && (
                      <p className="text-xs font-mono bg-destructive/10 p-2 rounded mt-2">
                        Actor initialization timeout after 10 seconds
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleActorRetry} variant="default">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry {retryCount > 0 && `(${retryCount})`}
                  </Button>
                  <Button onClick={handleLogout} variant="outline">
                    Log out
                  </Button>
                </div>
              </div>
            </div>
          ) : !actor || isAttemptInProgress ? (
            // Actor is initializing
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-4">
                <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Connecting…</p>
                <p className="text-xs text-muted-foreground/70">
                  Initializing backend connection
                </p>
              </div>
            </div>
          ) : !canShowMainContent ? (
            // Profile is loading
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-4">
                <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Loading profile...</p>
                <p className="text-xs text-muted-foreground/70">
                  Fetching user data
                </p>
              </div>
            </div>
          ) : profileError || profileTimeout ? (
            // Profile error or timeout
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="max-w-md w-full space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>
                    {profileTimeout ? 'Timeout' : 'Loading error'}
                  </AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>
                      {profileTimeout 
                        ? 'Loading the profile is taking too long. Please try again.'
                        : 'The profile could not be loaded. Please try again.'
                      }
                    </p>
                    {profileError && (
                      <p className="text-xs font-mono bg-destructive/10 p-2 rounded mt-2">
                        {profileError instanceof Error ? profileError.message : 'Unknown error'}
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleProfileRetry} variant="default">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry {retryCount > 0 && `(${retryCount})`}
                  </Button>
                  <Button onClick={handleLogout} variant="outline">
                    Log out
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Successfully loaded - show main content
            <ErrorBoundary>
              <Tabs defaultValue="portfolio" className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                  <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                  <TabsTrigger value="cards">Karten</TabsTrigger>
                </TabsList>
                
                <TabsContent value="portfolio">
                  <ErrorBoundary>
                    <PortfolioPage />
                  </ErrorBoundary>
                </TabsContent>
                
                <TabsContent value="cards">
                  <ErrorBoundary>
                    <CardsPage />
                  </ErrorBoundary>
                </TabsContent>
              </Tabs>
            </ErrorBoundary>
          )}
        </main>

        <Footer />
        <Toaster />
        {showProfileSetup && <ProfileSetupModal />}
      </div>
    </ThemeProvider>
  );
}
