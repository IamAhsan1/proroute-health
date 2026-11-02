import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { specialtyService, AdminSpecialty } from '../../../services/specialty.service';
import { UserProfile } from '../../../api/client';
import {
  Stethoscope,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit2,
  Power,
  Users,
  Sparkles,
  Layers,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from '../../../components/ui';

interface AdminSpecialtiesPageProps {
  currentUser: UserProfile | null;
}

const COMMON_ICONS = [
  'stethoscope',
  'heart-pulse',
  'brain',
  'bone',
  'sparkles',
  'ear',
  'baby',
  'eye',
  'pill',
  'activity',
];

export const AdminSpecialtiesPage: React.FC<AdminSpecialtiesPageProps> = ({ currentUser }) => {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State (for both Add and Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<AdminSpecialty | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('stethoscope');
  const [formIsActive, setFormIsActive] = useState(true);

  // 1. Fetch all admin specialties
  const { data: specialties = [], isLoading, isError, error } = useQuery({
    queryKey: ['adminSpecialties'],
    queryFn: () => specialtyService.getAllAdminSpecialties(),
    enabled: !!currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN'),
    staleTime: 1000 * 30,
  });

  // 2. Mutations
  const createMutation = useMutation({
    mutationFn: (payload: { name: string; slug?: string; description?: string; icon?: string }) =>
      specialtyService.createSpecialty(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminSpecialties'] });
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      setFeedback({ type: 'success', message: `Specialty "${data.name}" added successfully.` });
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create specialty';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { name?: string; description?: string | null; icon?: string | null; isActive?: boolean };
    }) => specialtyService.updateSpecialty(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminSpecialties'] });
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      setFeedback({ type: 'success', message: `Specialty "${data.name}" updated successfully.` });
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update specialty';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => specialtyService.deleteSpecialty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSpecialties'] });
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      setFeedback({ type: 'success', message: 'Specialty deleted successfully.' });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to delete specialty';
      setFeedback({ type: 'error', message: msg });
    },
  });

  // Modal open helpers
  const openCreateModal = () => {
    setEditingSpecialty(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormIcon('stethoscope');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (spec: AdminSpecialty) => {
    setEditingSpecialty(spec);
    setFormName(spec.name);
    setFormSlug(spec.slug);
    setFormDescription(spec.description || '');
    setFormIcon(spec.icon || 'stethoscope');
    setFormIsActive(spec.isActive);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSpecialty(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingSpecialty) {
      updateMutation.mutate({
        id: editingSpecialty.id,
        payload: {
          name: formName.trim(),
          description: formDescription.trim() || null,
          icon: formIcon.trim() || null,
          isActive: formIsActive,
        },
      });
    } else {
      createMutation.mutate({
        name: formName.trim(),
        slug: formSlug.trim() || undefined,
        description: formDescription.trim() || undefined,
        icon: formIcon.trim() || undefined,
      });
    }
  };

  const toggleSpecialtyStatus = (spec: AdminSpecialty) => {
    updateMutation.mutate({
      id: spec.id,
      payload: { isActive: !spec.isActive },
    });
  };

  // Metrics calculation
  const totalCount = specialties.length;
  const activeCount = specialties.filter((s) => s.isActive).length;
  const totalDoctorsAssigned = specialties.reduce((sum, s) => sum + (s.doctorCount || 0), 0);

  // Filtered list
  const filteredSpecialties = specialties.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? s.isActive
        : !s.isActive;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide w-fit">
            <Layers className="w-3.5 h-3.5" />
            SPECIALTIES DIRECTORY
          </div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-on-surface flex items-center gap-2">
            Medical Specialties Management
          </h1>
          <p className="text-on-surface-variant text-xs sm:text-sm max-w-2xl">
            Create, configure, and curate medical specialties. These define doctor qualification options and patient discovery filters across ProRoute.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['adminSpecialties'] })}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>

          <Button
            onClick={openCreateModal}
            className="gap-2 text-xs font-semibold shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Specialty
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-surface-container border-surface-container-highest shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-on-surface-variant">Total Specialties</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold font-headline text-on-surface">{totalCount}</span>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-container border-surface-container-highest shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-on-surface-variant">Active In Directory</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold font-headline text-primary">{activeCount}</span>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-container border-surface-container-highest shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-on-surface-variant">Registered Doctors</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold font-headline text-secondary">{totalDoctorsAssigned}</span>
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-medium border flex items-center justify-between animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-primary/10 border-primary/40 text-primary'
              : 'bg-destructive/10 border-destructive/40 text-destructive'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-outline hover:text-on-surface text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-surface-container border border-surface-container-highest rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search specialties or slugs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface-container-high border border-surface-container-highest focus:outline-none focus:border-primary text-on-surface placeholder:text-outline"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === filter
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Specialties Table / Cards */}
      <div className="bg-surface-container border border-surface-container-highest rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-surface-container-high/60 border-b border-surface-container-highest flex items-center justify-between">
          <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" />
            Defined Medical Specialties ({filteredSpecialties.length})
          </h3>
          <span className="text-xs text-on-surface-variant">
            Official Clinical Taxonomy
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-outline text-xs">
            Loading medical specialties...
          </div>
        ) : isError ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <h4 className="font-headline font-semibold text-sm text-destructive">Failed to Load Specialties</h4>
            <p className="text-on-surface-variant text-xs max-w-sm">
              {(error as any)?.message || 'An error occurred while fetching medical taxonomy.'}
            </p>
          </div>
        ) : filteredSpecialties.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-outline" />
            <h4 className="font-headline font-semibold text-sm text-on-surface">No Specialties Found</h4>
            <p className="text-on-surface-variant text-xs max-w-sm">
              {searchQuery ? 'No specialty matched your search criteria.' : 'No medical specialties defined yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-[12px] font-semibold border-b border-surface-container-highest">
                  <th className="py-3 px-4">Specialty & Icon</th>
                  <th className="py-3 px-4">Slug Identifier</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Doctors</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest/50">
                {filteredSpecialties.map((spec) => (
                  <tr key={spec.id} className="hover:bg-surface-container-high/40 transition-colors">
                    {/* Name & Icon */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-on-surface text-sm">{spec.name}</span>
                          <span className="text-[11px] text-outline">Icon: {spec.icon || 'stethoscope'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="py-3.5 px-4">
                      <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {spec.slug}
                      </code>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 max-w-xs truncate text-on-surface-variant text-xs">
                      {spec.description || <span className="italic text-outline">No description provided</span>}
                    </td>

                    {/* Doctors Count */}
                    <td className="py-3.5 px-4">
                      <Badge variant="secondary" className="gap-1 font-mono text-xs">
                        <Users className="w-3 h-3" />
                        {spec.doctorCount || 0}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {spec.isActive ? (
                        <Badge variant="default" className="text-[10px] bg-primary/20 text-primary border-primary/30">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-outline border-outline/30">
                          Inactive
                        </Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {/* Toggle Active Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSpecialtyStatus(spec)}
                          title={spec.isActive ? 'Deactivate Specialty' : 'Activate Specialty'}
                          className={`h-7 w-7 ${spec.isActive ? 'text-primary hover:text-destructive' : 'text-outline hover:text-primary'}`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </Button>

                        {/* Edit Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(spec)}
                          title="Edit Specialty"
                          className="h-7 w-7 text-outline hover:text-on-surface"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${spec.name}"?`)) {
                              deleteMutation.mutate(spec.id);
                            }
                          }}
                          disabled={spec.doctorCount > 0}
                          title={
                            spec.doctorCount > 0
                              ? 'Cannot delete specialty with registered doctors'
                              : 'Permanently Delete Specialty'
                          }
                          className="h-7 w-7 text-destructive/70 hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Specialty Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container border border-surface-container-highest rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" />
                {editingSpecialty ? `Edit Specialty: ${editingSpecialty.name}` : 'Create New Medical Specialty'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-outline hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              {editingSpecialty
                ? 'Update specialty parameters and visibility status across the platform.'
                : 'Define a new medical specialty. Once active, doctors can select this during onboarding.'}
            </p>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 mt-1">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface">
                  Specialty Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ophthalmology, Oncology"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingSpecialty) {
                      setFormSlug(
                        e.target.value
                          .toLowerCase()
                          .trim()
                          .replace(/[^\w\s-]/g, '')
                          .replace(/[\s_-]+/g, '-')
                      );
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-high border border-surface-container-highest focus:outline-none focus:border-primary text-on-surface"
                />
              </div>

              {/* Slug */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface">
                  URL Slug Identifier *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingSpecialty}
                  placeholder="e.g. ophthalmology"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-surface-container-high border border-surface-container-highest focus:outline-none focus:border-primary text-on-surface disabled:opacity-60"
                />
              </div>

              {/* Icon preset */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface">
                  Icon Identifier
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setFormIcon(iconName)}
                      className={`px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                        formIcon === iconName
                          ? 'bg-primary text-on-primary font-bold'
                          : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {iconName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Clinical domain summary, scope of practice..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-high border border-surface-container-highest focus:outline-none focus:border-primary text-on-surface"
                />
              </div>

              {/* Active Toggle (Edit mode) */}
              {editingSpecialty && (
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveToggle"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-container-highest text-primary focus:ring-primary"
                  />
                  <label htmlFor="isActiveToggle" className="text-xs text-on-surface font-medium cursor-pointer">
                    Active in public discovery and onboarding
                  </label>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-container-highest">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={closeModal}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending || updateMutation.isPending || !formName.trim()}
                  className="gap-1.5 font-semibold"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingSpecialty ? 'Update Specialty' : 'Create Specialty'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSpecialtiesPage;

