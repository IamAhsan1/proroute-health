import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { specialtyService, Specialty } from '../../../services/specialty.service';
import { doctorService, PublicDoctor } from '../../../services/doctor.service';
import { DoctorCard } from '../components/DoctorCard';
import { DirectorySearchToolbar } from '../components/DirectorySearchToolbar';
import { SpecialtyFilterChips } from '../components/SpecialtyFilterChips';
import { useCurrency } from '../../../context/CurrencyContext';
import {
  UserCheck,
  SearchX,
  LayoutGrid,
  List,
  ArrowUpDown,
  X,
  RotateCcw,
} from 'lucide-react';

export const DoctorDirectoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSpecialty = searchParams.get('specialty') || searchParams.get('specialtyId') || '';
  const urlSearch = searchParams.get('search') || '';

  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>(urlSpecialty);
  const [searchQuery, setSearchQuery] = useState<string>(urlSearch);
  const [maxFee, setMaxFee] = useState<number>(200);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recommended' | 'fee-asc' | 'fee-desc' | 'experience' | 'name'>('recommended');
  const { currency, rate } = useCurrency();
  const [undoSnapshot, setUndoSnapshot] = useState<{
    specialtyId: string;
    search: string;
    maxFee: number;
  } | null>(null);

  // Auto-dismiss undo notification after 6 seconds
  useEffect(() => {
    if (!undoSnapshot) return;
    const timer = setTimeout(() => {
      setUndoSnapshot(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [undoSnapshot]);

  // 1. Fetch active specialties from backend
  const { data: specialties = [], isLoading: isLoadingSpecialties } = useQuery<Specialty[]>({
    queryKey: ['activeSpecialties'],
    queryFn: specialtyService.getActiveSpecialties,
    staleTime: 1000 * 60 * 10,
  });

  // Synchronize state when URL query parameters change (e.g. from /specialties or navbar links)
  useEffect(() => {
    if (urlSpecialty && specialties.length > 0) {
      const match = specialties.find(
        (s) => s.slug === urlSpecialty || s.id === urlSpecialty
      );
      if (match) {
        setSelectedSpecialtyId(match.id);
      } else {
        setSelectedSpecialtyId(urlSpecialty);
      }
    } else if (!urlSpecialty) {
      setSelectedSpecialtyId('');
    }

    if (urlSearch !== undefined) {
      setSearchQuery(urlSearch);
    }
  }, [urlSpecialty, urlSearch, specialties]);

  // 2. Fetch approved doctors with filters
  const { data: doctorData, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['approvedDoctors', selectedSpecialtyId, searchQuery, maxFee],
    queryFn: () =>
      doctorService.getPublicDoctors({
        specialtyId: selectedSpecialtyId || undefined,
        search: searchQuery.trim() || undefined,
        maxFee: maxFee > 0 ? maxFee : undefined,
      }),
    staleTime: 1000 * 60 * 2,
  });

  const doctors: PublicDoctor[] = doctorData?.doctors || [];
  const selectedSpecialty = specialties.find((s) => s.id === selectedSpecialtyId);

  const sortedDoctors = [...doctors].sort((a, b) => {
    if (sortBy === 'fee-asc') return (Number(a.consultationFee) || 0) - (Number(b.consultationFee) || 0);
    if (sortBy === 'fee-desc') return (Number(b.consultationFee) || 0) - (Number(a.consultationFee) || 0);
    if (sortBy === 'experience') return (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  const hasActiveFilters = Boolean(selectedSpecialtyId || searchQuery || maxFee < 500);

  const handleSelectSpecialty = (id: string) => {
    setSelectedSpecialtyId(id);
    const params = new URLSearchParams(searchParams);
    if (id) {
      const match = specialties.find((s) => s.id === id);
      params.set('specialty', match ? match.slug : id);
    } else {
      params.delete('specialty');
      params.delete('specialtyId');
    }
    setSearchParams(params);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const params = new URLSearchParams(searchParams);
    if (val.trim()) {
      params.set('search', val.trim());
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    if (selectedSpecialtyId || searchQuery || maxFee !== 500) {
      setUndoSnapshot({
        specialtyId: selectedSpecialtyId,
        search: searchQuery,
        maxFee,
      });
    }
    setSelectedSpecialtyId('');
    setSearchQuery('');
    setMaxFee(500);
    setSearchParams({});
  };

  const handleUndoReset = () => {
    if (!undoSnapshot) return;
    setSelectedSpecialtyId(undoSnapshot.specialtyId);
    setSearchQuery(undoSnapshot.search);
    setMaxFee(undoSnapshot.maxFee);

    const params = new URLSearchParams();
    if (undoSnapshot.specialtyId) {
      const match = specialties.find((s) => s.id === undoSnapshot.specialtyId);
      params.set('specialty', match?.slug || undoSnapshot.specialtyId);
    }
    if (undoSnapshot.search.trim()) {
      params.set('search', undoSnapshot.search.trim());
    }
    setSearchParams(params);
    setUndoSnapshot(null);
  };

  return (
    <div className="w-full min-h-screen bg-background text-on-surface py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-surface-container border border-surface-container-highest p-6 sm:p-8 shadow-sm">
          <div className="relative z-10 max-w-3xl flex flex-col gap-2.5">
            <h1 className="font-headline font-bold text-3xl sm:text-4xl tracking-tight text-on-surface">
              Find &amp; Consult With <span className="text-primary">Verified Specialists</span>
            </h1>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Connect with board-certified physicians across clinical specialties for telehealth consultations, medical advice, and dedicated patient care.
            </p>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-surface-container border border-surface-container-highest rounded-2xl p-4 sm:p-6 flex flex-col gap-6 shadow-sm">
          <DirectorySearchToolbar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            maxFee={maxFee}
            onMaxFeeChange={setMaxFee}
          />

          <SpecialtyFilterChips
            specialties={specialties}
            selectedSpecialtyId={selectedSpecialtyId}
            onSelectSpecialty={handleSelectSpecialty}
            isLoading={isLoadingSpecialties}
          />
        </div>

        {/* Undo Filters Banner */}
        {undoSnapshot && (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-surface-container border border-primary/25 rounded-2xl shadow-sm text-sm"
          >
            <div className="flex items-center gap-2.5 text-on-surface">
              <RotateCcw className="w-4 h-4 text-primary shrink-0" />
              <span>
                Filters were reset.
                {undoSnapshot.search && (
                  <span className="text-on-surface-variant font-medium ml-1">
                    Search: &ldquo;{undoSnapshot.search}&rdquo;
                  </span>
                )}
                {undoSnapshot.specialtyId && (
                  <span className="text-on-surface-variant font-medium ml-1">
                    Specialty: {specialties.find((s) => s.id === undoSnapshot.specialtyId)?.name || 'Selected'}
                  </span>
                )}
                {undoSnapshot.maxFee < 500 && (
                  <span className="text-on-surface-variant font-medium ml-1">
                    Max Fee:{' '}
                    {currency === 'PKR'
                      ? `Rs. ${Math.round(undoSnapshot.maxFee * rate).toLocaleString('en-PK')}`
                      : `$${undoSnapshot.maxFee}`}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleUndoReset}
                className="px-3 py-1 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
              >
                Undo (Restore)
              </button>
              <button
                type="button"
                onClick={() => setUndoSnapshot(null)}
                aria-label="Dismiss undo notification"
                className="p-1 text-on-surface-variant hover:text-on-surface rounded-md hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Doctors Section Header & Controls */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-on-surface">Available Doctors</h2>
              <span className="text-xs bg-surface-container-highest px-2.5 py-0.5 rounded-full text-on-surface-variant font-medium">
                {sortedDoctors.length} Verified
              </span>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {/* Sorting Select */}
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <ArrowUpDown className="w-3.5 h-3.5 text-outline" />
                <span className="hidden sm:inline font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-surface border border-surface-container-highest rounded-xl px-2.5 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-xs"
                >
                  <option value="recommended">Recommended</option>
                  <option value="fee-asc">Fee: Low to High</option>
                  <option value="fee-desc">Fee: High to Low</option>
                  <option value="experience">Most Experienced</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>

              {/* View Mode Toggle Switcher */}
              <div className="flex items-center p-1 rounded-xl bg-surface border border-surface-container-highest shadow-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 motion-reduce:transform-none ${
                    viewMode === 'grid'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="Grid View"
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Grid</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95 motion-reduce:transform-none ${
                    viewMode === 'list'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="List View"
                  aria-label="List view"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">List</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap pt-1 animate-in fade-in duration-150 motion-reduce:animate-none">
              <span className="text-xs text-outline font-medium">Active filters:</span>
              {selectedSpecialty && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-surface-container-highest text-xs text-on-surface font-semibold shadow-xs animate-in fade-in zoom-in-95 duration-150 motion-reduce:animate-none">
                  <span>{selectedSpecialty.name}</span>
                  <button
                    onClick={() => handleSelectSpecialty('')}
                    className="text-outline hover:text-error transition-colors p-0.5 rounded cursor-pointer"
                    aria-label="Remove specialty filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-surface-container-highest text-xs text-on-surface font-semibold shadow-xs animate-in fade-in zoom-in-95 duration-150 motion-reduce:animate-none">
                  <span>"{searchQuery}"</span>
                  <button
                    onClick={() => handleSearchChange('')}
                    className="text-outline hover:text-error transition-colors p-0.5 rounded cursor-pointer"
                    aria-label="Remove search filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {maxFee < 500 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-surface-container-highest text-xs text-on-surface font-semibold shadow-xs animate-in fade-in zoom-in-95 duration-150 motion-reduce:animate-none">
                  <span>
                    Under{' '}
                    {currency === 'PKR'
                      ? `Rs. ${Math.round(maxFee * rate).toLocaleString('en-PK')}`
                      : `$${maxFee}`}
                  </span>
                  <button
                    onClick={() => setMaxFee(500)}
                    className="text-outline hover:text-error transition-colors p-0.5 rounded cursor-pointer"
                    aria-label="Remove fee filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-xs text-primary font-bold hover:underline transition-all cursor-pointer ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          {isLoadingDoctors ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-surface rounded-2xl p-6 border border-surface-container-highest animate-pulse flex flex-col gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-surface-container-high"></div>
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="h-4 bg-surface-container-high rounded w-3/4"></div>
                        <div className="h-3 bg-surface-container-high rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="h-16 bg-surface-container-high/50 rounded-xl"></div>
                    <div className="h-10 bg-surface-container-high/30 rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-surface rounded-2xl p-5 border border-surface-container-highest animate-pulse flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-surface-container-high shrink-0"></div>
                      <div className="space-y-2 flex-1 max-w-md">
                        <div className="h-4 bg-surface-container-high rounded w-1/2"></div>
                        <div className="h-3 bg-surface-container-high rounded w-3/4"></div>
                      </div>
                    </div>
                    <div className="w-24 h-10 bg-surface-container-high rounded-xl"></div>
                  </div>
                ))}
              </div>
            )
          ) : sortedDoctors.length === 0 ? (
            <div className="rounded-2xl bg-surface border border-surface-container-highest p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs animate-in fade-in duration-200 motion-reduce:animate-none">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-outline transition-transform duration-300 hover:scale-105 motion-reduce:transform-none">
                <SearchX className="w-6 h-6 text-outline" />
              </div>
              <h3 className="font-bold text-base text-on-surface">No Verified Doctors Found</h3>
              <p className="text-xs text-on-surface-variant max-w-md">
                We couldn&apos;t find any verified practitioners matching your selected criteria. Try adjusting your specialty or search query.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div key="grid-view" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200 motion-reduce:animate-none">
              {sortedDoctors.map((doc) => (
                <DoctorCard key={doc.id} doc={doc} viewMode="grid" />
              ))}
            </div>
          ) : (
            <div key="list-view" className="flex flex-col gap-3.5 animate-in fade-in duration-200 motion-reduce:animate-none">
              {sortedDoctors.map((doc) => (
                <DoctorCard key={doc.id} doc={doc} viewMode="list" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDirectoryPage;
