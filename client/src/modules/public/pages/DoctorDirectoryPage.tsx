import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { specialtyService, Specialty } from '../../../services/specialty.service';
import { doctorService, PublicDoctor } from '../../../services/doctor.service';
import { DoctorCard } from '../components/DoctorCard';
import { DirectorySearchToolbar } from '../components/DirectorySearchToolbar';
import { SpecialtyFilterChips } from '../components/SpecialtyFilterChips';

export const DoctorDirectoryPage: React.FC = () => {
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxFee, setMaxFee] = useState<number>(200);

  // 1. Fetch active specialties from backend
  const { data: specialties = [], isLoading: isLoadingSpecialties } = useQuery<Specialty[]>({
    queryKey: ['activeSpecialties'],
    queryFn: specialtyService.getActiveSpecialties,
    staleTime: 1000 * 60 * 10,
  });

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

  const handleResetFilters = () => {
    setSelectedSpecialtyId('');
    setSearchQuery('');
    setMaxFee(500);
  };

  return (
    <div className="w-full min-h-screen bg-background text-on-surface py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-high border border-surface-container-highest/60 p-6 sm:p-10 shadow-2xl">
          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-3xl flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-mono font-semibold tracking-wide w-fit">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              100% BOARD-VERIFIED PRACTITIONERS
            </div>
            <h1 className="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-on-surface">
              Find & Consult With <span className="text-primary">Verified Specialists</span>
            </h1>
            <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
              Browse top clinical departments and book consultations with certified doctors verified against official medical registers. Unverified accounts are strictly isolated.
            </p>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-surface-container/90 backdrop-blur-xl border border-surface-container-highest/70 rounded-xl p-4 sm:p-6 flex flex-col gap-6 shadow-lg">
          <DirectorySearchToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            maxFee={maxFee}
            onMaxFeeChange={setMaxFee}
          />

          <SpecialtyFilterChips
            specialties={specialties}
            selectedSpecialtyId={selectedSpecialtyId}
            onSelectSpecialty={setSelectedSpecialtyId}
            isLoading={isLoadingSpecialties}
          />
        </div>

        {/* Doctors Grid */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              Available Doctors
              <span className="text-xs font-mono bg-surface-container-highest px-2 py-0.5 rounded text-outline">
                {doctors.length} Verified
              </span>
            </h2>
          </div>

          {isLoadingDoctors ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-surface-container/70 rounded-xl p-6 border border-surface-container-highest animate-pulse flex flex-col gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-surface-container-highest"></div>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-4 bg-surface-container-highest rounded w-3/4"></div>
                      <div className="h-3 bg-surface-container-highest rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-12 bg-surface-container-highest rounded"></div>
                  <div className="h-10 bg-surface-container-highest rounded"></div>
                </div>
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="bg-surface-container/50 border border-dashed border-surface-container-highest rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[28px]">search_off</span>
              </div>
              <h3 className="font-headline font-semibold text-base text-on-surface">
                No Verified Doctors Found
              </h3>
              <p className="text-on-surface-variant text-xs max-w-md">
                No practitioners currently match your search criteria or price filter. Unverified doctor accounts are strictly hidden until approved by our medical board.
              </p>
              {(selectedSpecialtyId || searchQuery || maxFee < 500) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doc) => (
                <DoctorCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDirectoryPage;
