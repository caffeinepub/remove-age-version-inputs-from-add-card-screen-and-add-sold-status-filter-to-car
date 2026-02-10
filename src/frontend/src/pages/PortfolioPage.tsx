import { useState } from 'react';
import { useCalculateTotalInvested, useCalculateTotalReturns, useGetUserCards, useCalculateInvestmentTotals, useGetTransactionSummary, useCountCraftedCards, useGetSoldCardBalance } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, DollarSign, Package, Coins, Banknote, ArrowLeftRight, Sparkles, Receipt } from 'lucide-react';
import { PaymentMethod } from '../backend';
import SoldCardsModal from '../components/SoldCardsModal';
import CraftedCardsModal from '../components/CraftedCardsModal';

const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.cash]: 'Cash',
  [PaymentMethod.eth]: 'Eth',
  [PaymentMethod.essence]: 'Essence',
  [PaymentMethod.trade]: 'Tausch',
};

export default function PortfolioPage() {
  const [isSoldCardsModalOpen, setIsSoldCardsModalOpen] = useState(false);
  const [isCraftedCardsModalOpen, setIsCraftedCardsModalOpen] = useState(false);
  const { data: totalInvested = 0, isLoading: investedLoading } = useCalculateTotalInvested();
  const { data: totalReturns = 0, isLoading: returnsLoading } = useCalculateTotalReturns();
  const { data: cards = [], isLoading: cardsLoading } = useGetUserCards();
  const { data: investmentTotals, isLoading: investmentTotalsLoading } = useCalculateInvestmentTotals();
  const { data: transactionSummary, isLoading: summaryLoading } = useGetTransactionSummary();
  const { data: craftedCardsCount = BigInt(0), isLoading: craftedCardsLoading } = useCountCraftedCards();
  const { data: soldCardBalance = 0, isLoading: soldBalanceLoading } = useGetSoldCardBalance();

  const totalBalance = totalReturns - totalInvested;
  const isProfit = totalBalance >= 0;
  const profitPercentage = totalInvested > 0 ? (totalBalance / totalInvested) * 100 : 0;

  const soldCount = transactionSummary ? Number(transactionSummary.soldCount) : 0;
  const tradedGivenCount = transactionSummary ? Number(transactionSummary.tradedGivenCount) : 0;
  const tradedReceivedCount = transactionSummary ? Number(transactionSummary.tradedReceivedCount) : 0;
  const forSaleCount = transactionSummary ? Number(transactionSummary.forSaleCount) : 0;
  const craftedCount = Number(craftedCardsCount);

  const isSoldBalanceProfit = soldCardBalance >= 0;

  const isLoading = investedLoading || returnsLoading || cardsLoading || investmentTotalsLoading || summaryLoading || craftedCardsLoading || soldBalanceLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Lädt Portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Main Profit/Loss Card */}
      <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Gesamtbilanz</CardTitle>
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
            {isProfit ? 'Gewinn' : 'Verlust'}
          </div>
        </CardContent>
      </Card>

      {/* Sold Cards Balance Overview */}
      {soldCount > 0 && (
        <Card className="border-2 shadow-lg bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Receipt className="w-6 h-6 text-blue-500" />
              Bilanz verkaufter Karten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${isSoldBalanceProfit ? 'text-green-500' : 'text-red-500'}`}>
                {isSoldBalanceProfit ? '+' : ''}€{soldCardBalance.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Verkaufserlöse minus Kaufpreise aller verkauften Karten
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 border rounded-lg bg-card/50">
                <div className="text-sm text-muted-foreground mb-1">Anzahl verkauft</div>
                <div className="text-2xl font-bold">{soldCount}</div>
              </div>
              <div className="p-4 border rounded-lg bg-card/50">
                <div className="text-sm text-muted-foreground mb-1">Verkaufserlöse</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">€{totalReturns.toFixed(2)}</div>
              </div>
              <div className="p-4 border rounded-lg bg-card/50">
                <div className="text-sm text-muted-foreground mb-1">Bilanz</div>
                <div className={`text-2xl font-bold ${isSoldBalanceProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isSoldBalanceProfit ? '+' : ''}€{soldCardBalance.toFixed(2)}
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
            <CardTitle className="text-sm font-medium">Gesamtinvestitionen</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalInvested.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Alle Cash + Eth Karten</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rückflüsse</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalReturns.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Summe aller Verkaufspreise</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setIsSoldCardsModalOpen(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verkaufte Karten</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{soldCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Klicken für Details</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Karten</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forSaleCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Noch im Besitz</p>
          </CardContent>
        </Card>
      </div>

      {/* Investment Totals by Payment Method */}
      {investmentTotals && (investmentTotals.totalCashInvested > 0 || investmentTotals.totalEthInvested > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Investitionen</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{investmentTotals.totalCashInvested.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Alle Cash-Karten</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eth Investitionen</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{investmentTotals.totalEthInvested.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Alle Eth-Karten</p>
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
              Gecraftete Karten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-purple-500/5 border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-purple-600 dark:text-purple-400">Mit Essence erstellt</h3>
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-3xl font-bold">{craftedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Aktive Essence-Karten (nicht-monetär) • Klicken für Details</p>
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
              Getauschte Karten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-orange-500/5 border-orange-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-orange-600 dark:text-orange-400">Abgegeben</h3>
                  <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-3xl font-bold">{tradedGivenCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Karten weggegeben</p>
              </div>

              <div className="p-4 border rounded-lg bg-green-500/5 border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-green-600 dark:text-green-400">Erhalten</h3>
                  <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-3xl font-bold">{tradedReceivedCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Karten erhalten</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {cards.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Noch keine Karten</h3>
            <p className="text-muted-foreground max-w-sm">
              Füge deine erste Karte hinzu, um dein Portfolio zu starten. Wechsle zum Karten-Tab, um zu beginnen.
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
