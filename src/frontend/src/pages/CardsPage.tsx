import { useState, useMemo } from 'react';
import { useGetUserCards } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, X } from 'lucide-react';
import AddCardDialog from '../components/AddCardDialog';
import CardItem from '../components/CardItem';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PaymentMethod, Position, TransactionType } from '../backend';

const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.cash]: 'Cash',
  [PaymentMethod.eth]: 'Eth',
  [PaymentMethod.essence]: 'Essence',
  [PaymentMethod.trade]: 'Trade',
};

const positionLabels: Record<Position, string> = {
  [Position.torwart]: 'Goalkeeper',
  [Position.verteidiger]: 'Defender',
  [Position.mittelfeld]: 'Midfielder',
  [Position.sturm]: 'Forward',
};

export default function CardsPage() {
  const { data: cards = [], isLoading, isFetching } = useGetUserCards();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedClub, setSelectedClub] = useState<string>('all');
  const [selectedVersion, setSelectedVersion] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedSoldStatus, setSelectedSoldStatus] = useState<string>('all');

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const seasons = new Set<string>();
    const leagues = new Set<string>();
    const countries = new Set<string>();
    const clubs = new Set<string>();
    const versions = new Set<string>();

    cards.forEach(card => {
      if (card.season) seasons.add(card.season);
      if (card.league) leagues.add(card.league);
      if (card.country) countries.add(card.country);
      if (card.club) clubs.add(card.club);
      if (card.version) versions.add(card.version);
    });

    return {
      seasons: Array.from(seasons).sort(),
      leagues: Array.from(leagues).sort(),
      countries: Array.from(countries).sort(),
      clubs: Array.from(clubs).sort(),
      versions: Array.from(versions).sort(),
    };
  }, [cards]);

  // Filter cards based on all active filters
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      // Search filter
      if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Season filter
      if (selectedSeason !== 'all' && card.season !== selectedSeason) {
        return false;
      }

      // League filter
      if (selectedLeague !== 'all' && card.league !== selectedLeague) {
        return false;
      }

      // Country filter
      if (selectedCountry !== 'all' && card.country !== selectedCountry) {
        return false;
      }

      // Club filter
      if (selectedClub !== 'all' && card.club !== selectedClub) {
        return false;
      }

      // Version filter
      if (selectedVersion !== 'all' && card.version !== selectedVersion) {
        return false;
      }

      // Position filter
      if (selectedPosition !== 'all' && card.position !== selectedPosition) {
        return false;
      }

      // Payment method filter
      if (selectedPaymentMethod !== 'all' && card.paymentMethod !== selectedPaymentMethod) {
        return false;
      }

      // Sold status filter
      if (selectedSoldStatus === 'sold' && card.transactionType !== TransactionType.sold) {
        return false;
      }
      if (selectedSoldStatus === 'active' && card.transactionType === TransactionType.sold) {
        return false;
      }

      return true;
    });
  }, [cards, searchQuery, selectedSeason, selectedLeague, selectedCountry, selectedClub, selectedVersion, selectedPosition, selectedPaymentMethod, selectedSoldStatus]);

  const hasActiveFilters = searchQuery || selectedSeason !== 'all' || selectedLeague !== 'all' || 
    selectedCountry !== 'all' || selectedClub !== 'all' || selectedVersion !== 'all' || 
    selectedPosition !== 'all' || selectedPaymentMethod !== 'all' || selectedSoldStatus !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedSeason('all');
    setSelectedLeague('all');
    setSelectedCountry('all');
    setSelectedClub('all');
    setSelectedVersion('all');
    setSelectedPosition('all');
    setSelectedPaymentMethod('all');
    setSelectedSoldStatus('all');
  };

  // Show loading only on initial load
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Background refresh indicator */}
      {isFetching && !isLoading && (
        <div className="fixed top-20 right-4 z-50 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Refreshing...
        </div>
      )}

      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Cards</h1>
          <p className="text-muted-foreground mt-1">
            {filteredCards.length} {filteredCards.length === 1 ? 'card' : 'cards'}
            {hasActiveFilters && ` (filtered from ${cards.length})`}
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Add Card
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search cards by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Season Filter */}
          <div className="space-y-2">
            <Label>Season</Label>
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger>
                <SelectValue placeholder="All seasons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All seasons</SelectItem>
                {filterOptions.seasons.map(season => (
                  <SelectItem key={season} value={season}>{season}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* League Filter */}
          <div className="space-y-2">
            <Label>League</Label>
            <Select value={selectedLeague} onValueChange={setSelectedLeague}>
              <SelectTrigger>
                <SelectValue placeholder="All leagues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All leagues</SelectItem>
                {filterOptions.leagues.map(league => (
                  <SelectItem key={league} value={league}>{league}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country Filter */}
          <div className="space-y-2">
            <Label>Country</Label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="All countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {filterOptions.countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Club Filter */}
          <div className="space-y-2">
            <Label>Club</Label>
            <Select value={selectedClub} onValueChange={setSelectedClub}>
              <SelectTrigger>
                <SelectValue placeholder="All clubs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clubs</SelectItem>
                {filterOptions.clubs.map(club => (
                  <SelectItem key={club} value={club}>{club}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Version Filter */}
          <div className="space-y-2">
            <Label>Version</Label>
            <Select value={selectedVersion} onValueChange={setSelectedVersion}>
              <SelectTrigger>
                <SelectValue placeholder="All versions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All versions</SelectItem>
                {filterOptions.versions.map(version => (
                  <SelectItem key={version} value={version}>{version}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Position Filter */}
          <div className="space-y-2">
            <Label>Position</Label>
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger>
                <SelectValue placeholder="All positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All positions</SelectItem>
                {Object.entries(positionLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Filter */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="All methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {Object.entries(paymentMethodLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sold Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={selectedSoldStatus} onValueChange={setSelectedSoldStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All cards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cards</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="sold">Sold only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearAllFilters} className="w-full md:w-auto">
            <X className="w-4 h-4 mr-2" />
            Clear all filters
          </Button>
        )}
      </div>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground text-lg">
            {hasActiveFilters ? 'No cards match your filters' : 'No cards yet. Add your first card to get started!'}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearAllFilters} className="mt-4">
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCards.map(card => (
            <CardItem key={card.id.toString()} card={card} />
          ))}
        </div>
      )}

      {/* Add Card Dialog */}
      <AddCardDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        existingCards={cards}
      />
    </div>
  );
}
