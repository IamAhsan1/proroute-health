import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { specialtyService, Specialty } from '../../../services/specialty.service';
import { getSpecialtyLucideIcon } from '../components/DoctorCard';
import {
  Layers,
  Search,
  ArrowRight,
  ShieldCheck,
  Building2,
  Stethoscope,
  X,
} from 'lucide-react';

export const SpecialtiesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: specialties = [], isLoading } = useQuery<Specialty[]>({
    queryKey: ['activeSpecialties'],
    queryFn: specialtyService.getActiveSpecialties,
    staleTime: 1000 * 60 * 10,
  });

  const filtered = specialties.filter((s) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      s.slug.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full min-h-screen bg-background text-on-surface py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-surface-container border border-surface-container-highest p-6 sm:p-10 shadow-sm">
          <div className="relative z-10 max-w-3xl flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide w-fit">
              <ShieldCheck className="w-4 h-4" />
              VERIFIED CLINICAL DEPARTMENTS
            </div>
            <h1 className="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-on-surface">
              Explore All <span className="text-primary">Medical Specialties</span>
            </h1>
            <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
              Browse our board-certified clinical departments. Whether you require cardiology, dermatology, or specialized consultations, find verified physicians ready to assist you.
            </p>
          </div>
        </div>

        {/* Search & Stats Filter Toolbar */}
        <div className="bg-surface-container border border-surface-container-highest rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by specialty name, symptom, or condition..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest focus:border-primary focus:outline-none text-xs text-on-surface placeholder:text-outline transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-outline">
            <Layers className="w-4 h-4 text-primary" />
            <span>
              Showing {filtered.length} of {specialties.length} Specialties
            </span>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-surface border border-surface-container-highest p-6 flex flex-col gap-4 animate-pulse"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-container-highest" />
                <div className="h-5 w-1/2 rounded bg-surface-container-highest" />
                <div className="h-4 w-full rounded bg-surface-container-highest" />
                <div className="h-8 w-28 rounded-xl bg-surface-container-highest mt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Specialties Grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((spec) => {
              const SpecIcon = getSpecialtyLucideIcon(spec.slug);
              return (
                <div
                  key={spec.id}
                  className="rounded-2xl bg-surface border border-surface-container-highest/80 p-6 shadow-xs hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 transition-all flex flex-col justify-between gap-5 group"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-all shadow-xs">
                        <SpecIcon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-outline px-2.5 py-1 rounded-full bg-surface-container-high/60 border border-surface-container-highest">
                        Active
                      </span>
                    </div>

                    <div>
                      <h3 className="font-headline font-bold text-lg text-on-surface group-hover:text-primary transition-colors">
                        {spec.name}
                      </h3>
                      <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                        {spec.description ||
                          `Comprehensive clinical diagnosis, treatment, and ongoing care within the ${spec.name.toLowerCase()} department.`}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-surface-container-highest/60 flex items-center justify-between">
                    <span className="text-xs text-outline flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5" />
                      Certified Doctors
                    </span>
                    <Link
                      to={`/doctors?specialty=${encodeURIComponent(spec.slug)}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-all group-hover:shadow-xs"
                    >
                      <span>Find Doctors</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filtered.length === 0 && (
          <div className="rounded-2xl bg-surface border border-surface-container-highest p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-high text-outline flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-headline font-bold text-lg text-on-surface">
              No matching medical specialties
            </h3>
            <p className="text-xs text-on-surface-variant max-w-sm">
              We couldn't find any clinical specialty matching "{searchTerm}". Try another term or reset your search.
            </p>
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="mt-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              Show All Specialties
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
