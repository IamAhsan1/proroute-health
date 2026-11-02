import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { specialtyService, Specialty } from '../../../services/specialty.service';
import { doctorService, PublicDoctor } from '../../../services/doctor.service';
import { DoctorCard } from '../components/DoctorCard';
import { DirectorySearchToolbar } from '../components/DirectorySearchToolbar';
import { SpecialtyFilterChips } from '../components/SpecialtyFilterChips';
import { ShieldCheck, UserCheck, SearchX } from 'lucide-react';

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
        <div className="relative overflow-hidden rounded-3xl bg-surface-container border border-surface-container-highest p-6 sm:p-8 shadow-sm">
          <div className="relative z-10 max-w-3xl flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide w-fit">
              <ShieldCheck className="w-4 h-4" />
              100% BOARD-VERIFIED PRACTITIONERS
            </div>
            <h1 className="font-headline font-bold text-3xl sm:text-4xl tracking-tight text-on-surface">
              Find &amp; Consult With <span className="text-primary">Verified Specialists</span>
            </h1>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Browse top clinical departments and book consultations with certified doctors verified against official medical registers. Only licensed and approved physicians are displayed in this directory.
            </p>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-surface-container border border-surface-container-highest rounded-2xl p-4 sm:p-6 flex flex-col gap-6 shadow-sm">
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
              <UserCheck className="w-5 h-5 text-primary" />
              Available Doctors
              <span className="text-xs bg-surface-container-highest px-2.5 py-0.5 rounded-full text-on-surface-variant font-medium">
                {doctors.length} Verified
              </span>
            </h2>
          </div>

          {isLoadingDoctors ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-surface-container/70 rounded-2xl p-6 border border-surface-container-highest animate-pulse flex flex-col gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-surface-container-highest"></div>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-4 bg-surface-container-highest rounded w-3/4"></div>
                      <div className="h-3 bg-surface-container-highest rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-12 bg-surface-container-highest/50 rounded-xl"></div>
                  <div className="h-8 bg-surface-container-highest/30 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="rounded-2xl bg-surface-container/60 border border-surface-container-highest/60 p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-outline">
                <SearchX className="w-6 h-6 text-outline" />
              </div>
              <h3 className="font-bold text-base text-on-surface">No Verified Doctors Found</h3>
              <p className="text-xs text-on-surface-variant max-w-md">
                No active medical practitioners matched your current specialty filter or search parameters.
              </p>
              {(selectedSpecialtyId || searchQuery || maxFee < 500) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
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
