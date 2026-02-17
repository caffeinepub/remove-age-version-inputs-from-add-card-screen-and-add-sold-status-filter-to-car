import { useGetChangeHistory, useGetUserCards, useBackfillHistoryEntries } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, History, Plus, Edit, Trash2, DollarSign, ShoppingCart, ArrowLeftRight, RotateCcw, Clock, Calendar } from 'lucide-react';
import { formatRelativeTime, formatTimestamp } from '../utils/formatTimestamp';
import { ChangeAction, type CardId } from '../backend';
import { useMemo, useEffect, useRef } from 'react';

const actionConfig: Record<ChangeAction, { label: string; icon: React.ComponentType<{ className?: string }>; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  [ChangeAction.addCard]: { label: 'Added', icon: Plus, variant: 'default' },
  [ChangeAction.editCard]: { label: 'Edited', icon: Edit, variant: 'secondary' },
  [ChangeAction.deleteCard]: { label: 'Deleted', icon: Trash2, variant: 'destructive' },
  [ChangeAction.updateSalePrice]: { label: 'Price Updated', icon: DollarSign, variant: 'outline' },
  [ChangeAction.markSold]: { label: 'Sold', icon: ShoppingCart, variant: 'default' },
  [ChangeAction.trade]: { label: 'Traded', icon: ArrowLeftRight, variant: 'secondary' },
  [ChangeAction.revertTrade]: { label: 'Trade Reverted', icon: RotateCcw, variant: 'outline' },
};

export default function HistoryPage() {
  const {
    data,
    isLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useGetChangeHistory();

  const { data: userCards } = useGetUserCards();
  const { mutate: backfillHistory } = useBackfillHistoryEntries();
  const backfillAttempted = useRef(false);

  // Build a lookup map from cardId to card name
  const cardNameMap = useMemo(() => {
    if (!userCards) return new Map<string, string>();
    
    const map = new Map<string, string>();
    userCards.forEach(card => {
      map.set(card.id.toString(), card.name);
    });
    return map;
  }, [userCards]);

  // Helper function to format card IDs with names
  const formatCardIds = (cardIds: CardId[]): string => {
    return cardIds.map(id => {
      const idStr = id.toString();
      const name = cardNameMap.get(idStr);
      return name ? `#${idStr} (${name})` : `#${idStr}`;
    }).join(', ');
  };

  // Flatten all pages into a single array
  const allEntries = data?.pages.flatMap(page => page) ?? [];

  // Trigger backfill on first load if user has cards but no history
  useEffect(() => {
    if (!backfillAttempted.current && userCards && userCards.length > 0 && allEntries.length === 0 && !isLoading) {
      backfillAttempted.current = true;
      console.log('Triggering history backfill for existing cards...');
      backfillHistory(undefined, {
        onSuccess: () => {
          console.log('Backfill completed, refetching history...');
          refetch();
        },
      });
    }
  }, [userCards, allEntries.length, isLoading, backfillHistory, refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading activity history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Background refresh indicator */}
      {isFetching && !isLoading && !isFetchingNextPage && (
        <div className="fixed top-20 right-4 z-50 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Refreshing...
        </div>
      )}

      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <History className="w-6 h-6" />
            Activity History
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Track when cards were added to your collection and when they were sold
          </p>
        </CardHeader>
        <CardContent>
          {allEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Your card activity will appear here. Add cards to your collection or mark them as sold to see your history.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {allEntries.map((entry, index) => {
                  const config = actionConfig[entry.action];
                  const Icon = config.icon;
                  
                  return (
                    <div
                      key={`${entry.timestamp}-${index}`}
                      className="flex gap-4 p-4 border rounded-lg bg-card/50 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={config.variant} className="font-semibold">
                              {config.label}
                            </Badge>
                            {entry.cardIds.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {formatCardIds(entry.cardIds)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>
                                {formatRelativeTime(entry.timestamp)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground/80">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {formatTimestamp(entry.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-foreground break-words">
                          {entry.summary}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {hasNextPage && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    variant="outline"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load more'
                    )}
                  </Button>
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
