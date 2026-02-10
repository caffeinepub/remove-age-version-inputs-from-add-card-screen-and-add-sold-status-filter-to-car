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
  [PaymentMethod.trade]: 'Tausch',
};

const positionLabels: Record<Position, string> = {
  [Position.torwart]: 'Torwart',
  [Position.verteidiger]: 'Verteidiger',
  [Position.mittelfeld]: 'Mittelfeld',
  [Position.sturm]: 'Sturm',
};

export default function CardsPage() {
  const { data: cards = [], isLoading } = useGetUserCards();
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
      if (selectedSoldStatus === 'notSold' && card.transactionType === TransactionType.sold) {
        return false;
      }

      return true;
    });
  }, [cards, searchQuery, selectedSeason, selectedLeague, selectedCountry, selectedClub, selectedVersion, selectedPosition, selectedPaymentMethod, selectedSoldStatus]);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || selectedSeason !== 'all' || selectedLeague !== 'all' || 
                          selectedCountry !== 'all' || selectedClub !== 'all' || selectedVersion !== 'all' ||
                          selectedPosition !== 'all' || selectedPaymentMethod !== 'all' || selectedSoldStatus !== 'all';

  // Reset all filters
  const resetFilters = () => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Lädt Karten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Meine Karten</h2>
          <p className="text-muted-foreground mt-1">
            {filteredCards.length} {hasActiveFilters ? 'gefilterte' : ''} Karte(n) {hasActiveFilters && `von ${cards.length} insgesamt`}
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Karte hinzufügen
        </Button>
      </div>

      {/* Search and Filter Section */}
      {cards.length > 0 && (
        <div className="space-y-4 p-4 border rounded-lg bg-card">
          {/* Search Bar */}
          <div className="space-y-2">
            <Label htmlFor="search">Suche nach Name</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="Kartenname eingeben..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Season Filter */}
            <div className="space-y-2">
              <Label htmlFor="season-filter">Saison</Label>
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger id="season-filter">
                  <SelectValue placeholder="Alle Saisons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Saisons</SelectItem>
                  {filterOptions.seasons.map(season => (
                    <SelectItem key={season} value={season}>{season}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* League Filter */}
            <div className="space-y-2">
              <Label htmlFor="league-filter">Liga</Label>
              <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                <SelectTrigger id="league-filter">
                  <SelectValue placeholder="Alle Ligen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Ligen</SelectItem>
                  {filterOptions.leagues.map(league => (
                    <SelectItem key={league} value={league}>{league}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country Filter */}
            <div className="space-y-2">
              <Label htmlFor="country-filter">Land</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger id="country-filter">
                  <SelectValue placeholder="Alle Länder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Länder</SelectItem>
                  {filterOptions.countries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Club Filter */}
            <div className="space-y-2">
              <Label htmlFor="club-filter">Club</Label>
              <Select value={selectedClub} onValueChange={setSelectedClub}>
                <SelectTrigger id="club-filter">
                  <SelectValue placeholder="Alle Clubs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Clubs</SelectItem>
                  {filterOptions.clubs.map(club => (
                    <SelectItem key={club} value={club}>{club}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Version Filter */}
            <div className="space-y-2">
              <Label htmlFor="version-filter">Version</Label>
              <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                <SelectTrigger id="version-filter">
                  <SelectValue placeholder="Alle Versionen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Versionen</SelectItem>
                  {filterOptions.versions.map(version => (
                    <SelectItem key={version} value={version}>{version}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Position Filter */}
            <div className="space-y-2">
              <Label htmlFor="position-filter">Position</Label>
              <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                <SelectTrigger id="position-filter">
                  <SelectValue placeholder="Alle Positionen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Positionen</SelectItem>
                  {Object.entries(positionLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method Filter */}
            <div className="space-y-2">
              <Label htmlFor="payment-filter">Bezahlart</Label>
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger id="payment-filter">
                  <SelectValue placeholder="Alle Bezahlarten" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Bezahlarten</SelectItem>
                  {Object.entries(paymentMethodLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sold Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="sold-filter">Verkaufsstatus</Label>
              <Select value={selectedSoldStatus} onValueChange={setSelectedSoldStatus}>
                <SelectTrigger id="sold-filter">
                  <SelectValue placeholder="Alle Karten" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Karten</SelectItem>
                  <SelectItem value="sold">Verkauft</SelectItem>
                  <SelectItem value="notSold">Nicht verkauft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <X className="w-4 h-4 mr-2" />
                Filter zurücksetzen
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {cards.length === 0 
              ? 'Noch keine Karten vorhanden. Füge deine erste Karte hinzu!'
              : 'Keine Karten gefunden, die den Filterkriterien entsprechen.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCards.map(card => (
            <CardItem key={card.id.toString()} card={card} />
          ))}
        </div>
      )}

      <AddCardDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        existingCards={cards}
      />
    </div>
  );
}
