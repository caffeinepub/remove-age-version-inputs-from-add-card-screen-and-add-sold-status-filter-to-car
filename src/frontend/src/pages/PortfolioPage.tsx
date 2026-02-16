import { useState, useMemo } from 'react';
import { useGetPortfolioSnapshot, useGetTransactionGroups } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, DollarSign, Package, Coins, Banknote, ArrowLeftRight, Sparkles, Receipt, ShoppingCart } from 'lucide-react';
import { PaymentMethod, TransactionType } from '../backend';
import SoldCardsModal from '../components/SoldCardsModal';
import CraftedCardsModal from '../components/CraftedCardsModal';

const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.cash]: 'Cash',
  [PaymentMethod.eth]: 'Eth',
  [PaymentMethod.essence]: 'Essence',
  [PaymentMethod.trade]: 'Trade',
};

export default function PortfolioPage() {
  const [isSoldCardsModalOpen, setIsSoldCardsModalOpen] = useState(false);
  const [isCraftedCardsModalOpen, setIsCraftedCardsModalOpen] = useState(false);
  
  // Single query for all portfolio data
  const { data: snapshot, isLoading: snapshotLoading, isFetching: snapshotFetching } = useGetPortfolioSnapshot();
  
  // Only fetch transaction groups for modals (lazy loaded)
  const { data: transactionGroups } = useGetTransactionGroups();

  // Derive all metrics from snapshot
  const totalInvested = snapshot?.totalInvested ?? 0;
  const totalReturns = snapshot?.totalReturns ?? 0;
  const totalBalance = snapshot?.totalBalance ?? 0;
  const investmentTotals = snapshot?.investmentTotals ?? { totalCashInvested: 0, totalEthInvested: 0 };
  const allCards = snapshot?.allCards ?? [];

  const isProfit = totalBalance >= 0;
  const profitPercentage = totalInvested > 0 ? (totalBalance / totalInvested) * 100 : 0;

  // Calculate transaction counts from snapshot cards
  const transactionCounts = useMemo(() => {
    let soldCount = 0;
    let tradedGivenCount = 0;
    let tradedReceivedCount = 0;
    let forSaleCount = 0;
    let craftedCount = 0;

    allCards.forEach(card => {
      switch (card.transactionType) {
        case TransactionType.sold:
          soldCount++;
          break;
        case TransactionType.tradedGiven:
          tradedGivenCount++;
          break;
        case TransactionType.tradedReceived:
          tradedReceivedCount++;
          break;
        case TransactionType.forSale:
          forSaleCount++;
          if (card.paymentMethod === PaymentMethod.essence) {
            craftedCount++;
          }
          break;
      }
    });

    return { soldCount, tradedGivenCount, tradedReceivedCount, forSaleCount, craftedCount };
  }, [allCards]);

  const { soldCount, tradedGivenCount, tradedReceivedCount, forSaleCount, craftedCount } = transactionCounts;

  // Calculate sold card balance and purchase total
  const soldCardMetrics = useMemo(() => {
    const soldCards = allCards.filter(card => card.transactionType === TransactionType.sold);
    
    let purchaseTotal = 0;
    let saleTotal = 0;
    
    soldCards.forEach(card => {
      if (card.paymentMethod !== PaymentMethod.essence) {
        purchaseTotal += card.purchasePrice * (1 - card.discountPercent / 100);
      }
      if (card.salePrice !== undefined && card.salePrice !== null) {
        saleTotal += card.salePrice;
      }
    });
    
    const balance = saleTotal - purchaseTotal;
    
    return { purchaseTotal, saleTotal, balance };
  }, [allCards]);

  const isSoldBalanceProfit = soldCardMetrics.balance >= 0;

  // Show loading only on initial load, not during background refresh
  if (snapshotLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Background refresh indicator */}
      {snapshotFetching && !snapshotLoading && (
        <div className="fixed top-20 right-4 z-50 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Refreshing...
        </div>
      )}

      {/* Main Profit/Loss Card */}
      <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Total Balance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`text-5xl font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {isProfit ? '+' : ''}€{totalBalance.toFixed(2)}
            </div>
            <div className={`text-lg mt-2 ${isProfit ? 'text-green-500/80' : 'text-red-500/80'}`}>
              {isProfit ? '+' : ''}
              {profitPercentage.toFixed(2)}%
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            {isProfit ? (
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-10 h-10 text-green-500" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                <TrendingDown className="w-10 h-10 text-red-500" />
              </div>
            )}
          </div>

          <div className="text-center text-muted-foreground">
            {isProfit ? 'Profit' : 'Loss'}
          </div>
        </CardContent>
      </Card>

      {/* Sold Cards Balance Overview */}
      {soldCount > 0 && (
        <Card className="border-2 shadow-lg bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Receipt className="w-6 h-6 text-blue-500" />
              Sold Cards Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${isSoldBalanceProfit ? 'text-green-500' : 'text-red-500'}`}>
                {isSoldBalanceProfit ? '+' : ''}€{soldCardMetrics.balance.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Sale proceeds minus purchase prices of all sold cards
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="p-4 border rounded-lg bg-card/50">
                <div className="text-sm text-muted-foreground mb-1">Cards sold</div>
                <div className="text-2xl font-bold">{soldCount}</div>
              </div>
              <div className="p-4 border rounded-lg bg-card/50">
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3" />
                  Purchase price
                </div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">€{soldCardMetrics.purchaseTotal.toFixed(2)}</div>
              </div>
              <div className="p-4 border rounded-lg bg-card/50">
                <div className="text-sm text-muted-foreground mb-1">Sale proceeds</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">€{soldCardMetrics.saleTotal.toFixed(2)}</div>
              </div>
              <div className="p-4 border rounded-lg bg-card/50">
                <div className="text-sm text-muted-foreground mb-1">Balance</div>
                <div className={`text-2xl font-bold ${isSoldBalanceProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isSoldBalanceProfit ? '+' : ''}€{soldCardMetrics.balance.toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalInvested.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">All Cash + Eth cards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returns</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalReturns.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Sum of all sale prices</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setIsSoldCardsModalOpen(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sold Cards</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{soldCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Click for details</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forSaleCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Still in possession</p>
          </CardContent>
        </Card>
      </div>

      {/* Investment Totals by Payment Method */}
      {(investmentTotals.totalCashInvested > 0 || investmentTotals.totalEthInvested > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Investments</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{investmentTotals.totalCashInvested.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">All Cash cards</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eth Investments</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{investmentTotals.totalEthInvested.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">All Eth cards</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Crafted Cards Section */}
      {craftedCount > 0 && (
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setIsCraftedCardsModalOpen(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Crafted Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-purple-500/5 border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-purple-600 dark:text-purple-400">Created with Essence</h3>
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-3xl font-bold">{craftedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Active Essence cards (non-monetary) • Click for details</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traded Cards Section */}
      {(tradedGivenCount > 0 || tradedReceivedCount > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5" />
              Traded Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-orange-500/5 border-orange-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-orange-600 dark:text-orange-400">Given</h3>
                  <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-3xl font-bold">{tradedGivenCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Cards given away</p>
              </div>

              <div className="p-4 border rounded-lg bg-green-500/5 border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-green-600 dark:text-green-400">Received</h3>
                  <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-3xl font-bold">{tradedReceivedCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Cards received</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {allCards.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cards yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Add your first card to start your portfolio. Switch to the Cards tab to begin.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sold Cards Modal */}
      <SoldCardsModal open={isSoldCardsModalOpen} onOpenChange={setIsSoldCardsModalOpen} />
      
      {/* Crafted Cards Modal */}
      <CraftedCardsModal open={isCraftedCardsModalOpen} onOpenChange={setIsCraftedCardsModalOpen} />
    </div>
  );
}
