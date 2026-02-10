import { useQueryClient } from '@tanstack/react-query';
import { useInternetIdentity } from './useInternetIdentity';

/**
 * Hook that exposes the React Query state for the actor initialization query.
 * This allows components to detect actor initialization failures and render appropriate error states.
 */
export function useActorQueryState() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  
  const actorQueryKey = ['actor', identity?.getPrincipal().toString()];
  const queryState = queryClient.getQueryState(actorQueryKey);
  
  // Derive useful booleans for the UI
  const isAttemptInProgress = queryState?.fetchStatus === 'fetching';
  const isError = queryState?.status === 'error';
  const isIdleWithoutData = queryState?.status === 'pending' && queryState?.fetchStatus === 'idle' && !queryState?.data;
  const hasData = !!queryState?.data;
  
  return {
    queryState,
    isAttemptInProgress,
    isError,
    isIdleWithoutData,
    hasData,
    error: queryState?.error,
    // Function to manually retry actor initialization
    retry: () => {
      queryClient.invalidateQueries({ queryKey: actorQueryKey });
      queryClient.refetchQueries({ queryKey: actorQueryKey });
    }
  };
}
