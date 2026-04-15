import { useState } from 'react';
import { Plus, Target, Edit2, Trash2, ToggleLeft, ToggleRight, Filter, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import { useGame, Mission, DAY_NAMES } from '@/contexts/GameContext';
import { CreateMissionModal } from '@/components/CreateMissionModal';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type TypeFilter = 'all' | 'normal' | 'daily';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
type CategoryFilter = string;

export function Missions() {
  const { missions, updateMission, deleteMission } = useGame();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [deletingMission, setDeletingMission] = useState<Mission | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const categories = Array.from(new Set(missions.map(m => m.category))).sort();

  const filteredMissions = missions.filter(m => {
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;
    if (priorityFilter !== 'all' && m.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
    return true;
  });

  const sortedMissions = [...filteredMissions].sort((a, b) => {
    const pOrder = { high: 0, medium: 1, low: 2 };
    const pDiff = (pOrder[a.priority] || 1) - (pOrder[b.priority] || 1);
    if (pDiff !== 0) return pDiff;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });

  const activeMissions = sortedMissions.filter(m => m.active);
  const inactiveMissions = sortedMissions.filter(m => !m.active);
  const activeFiltersCount = [typeFilter !== 'all', priorityFilter !== 'all', categoryFilter !== 'all'].filter(Boolean).length;

  const handleToggleActive = async (mission: Mission) => {
    await updateMission(mission.id, { active: !mission.active });
  };

  const handleDelete = async () => {
    if (deletingMission) {
      await deleteMission(deletingMission.id);
      setDeletingMission(null);
    }
  };

  return (
    <div className="min-h-screen pb-safe">
      <main className="container px-4 md:px-6 py-6 space-y-5 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Missões</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {missions.length} {missions.length === 1 ? 'missão criada' : 'missões criadas'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center transition-all relative',
                showFilters ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <Filter className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-card rounded-xl p-4 border border-border space-y-3 animate-fade-in-up">
            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Tipo</p>
              <div className="flex gap-1.5">
                {([['all', 'Todas'], ['normal', 'Normais'], ['daily', 'Diárias']] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setTypeFilter(val)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', typeFilter === val ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Prioridade</p>
              <div className="flex gap-1.5">
                {([['all', 'Todas', null], ['high', 'Alta', ArrowUp], ['medium', 'Média', ArrowRight], ['low', 'Baixa', ArrowDown]] as const).map(([val, label, Icon]) => (
                  <button key={val} onClick={() => setPriorityFilter(val as PriorityFilter)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1', priorityFilter === val ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
                    {Icon && <Icon className="w-3 h-3" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {categories.length > 0 && (
              <div>
                <p className="text-[11px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Categoria</p>
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={() => setCategoryFilter('all')}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', categoryFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                    Todas
                  </button>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setCategoryFilter(cat)}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize', categoryFilter === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {activeFiltersCount > 0 && (
              <button onClick={() => { setTypeFilter('all'); setPriorityFilter('all'); setCategoryFilter('all'); }}
                className="text-xs text-destructive hover:underline">
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Active Missions */}
        {activeMissions.length > 0 && (
          <section>
            <h2 className="text-[11px] font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider">
              Ativas ({activeMissions.length})
            </h2>
            <div className="space-y-2">
              {activeMissions.map(mission => (
                <MissionItem key={mission.id} mission={mission} onEdit={() => setEditingMission(mission)} onDelete={() => setDeletingMission(mission)} onToggle={() => handleToggleActive(mission)} />
              ))}
            </div>
          </section>
        )}

        {/* Inactive Missions */}
        {inactiveMissions.length > 0 && (
          <section>
            <h2 className="text-[11px] font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider">
              Inativas ({inactiveMissions.length})
            </h2>
            <div className="space-y-2 opacity-50">
              {inactiveMissions.map(mission => (
                <MissionItem key={mission.id} mission={mission} onEdit={() => setEditingMission(mission)} onDelete={() => setDeletingMission(mission)} onToggle={() => handleToggleActive(mission)} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {missions.length === 0 && (
          <div className="bg-card rounded-xl p-8 text-center border border-border">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">Nenhuma missão criada</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Comece criando sua primeira missão para ganhar XP e moedas!
            </p>
            <button onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-all">
              <Plus className="w-3.5 h-3.5" />
              Criar Missão
            </button>
          </div>
        )}
      </main>

      {(showCreateModal || editingMission) && (
        <CreateMissionModal onClose={() => { setShowCreateModal(false); setEditingMission(null); }} editMission={editingMission} />
      )}

      <AlertDialog open={!!deletingMission} onOpenChange={() => setDeletingMission(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir missão?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingMission?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MissionItem({ mission, onEdit, onDelete, onToggle }: { mission: Mission; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  const PRIORITY_ICONS = { high: ArrowUp, medium: ArrowRight, low: ArrowDown };
  const PRIORITY_COLORS = { high: 'text-destructive', medium: 'text-[hsl(var(--coin))]', low: 'text-muted-foreground' };
  const PIcon = PRIORITY_ICONS[mission.priority || 'medium'];

  return (
    <div className="bg-card rounded-xl p-4 border border-border hover:border-primary/20 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <PIcon className={cn('w-3.5 h-3.5 flex-shrink-0', PRIORITY_COLORS[mission.priority || 'medium'])} />
            <h3 className="font-medium text-sm text-foreground">{mission.title}</h3>
          </div>
          {mission.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{mission.description}</p>}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground font-medium">{mission.category}</span>
            <span className={cn('text-[10px] font-medium', mission.type === 'daily' ? 'text-primary' : 'text-muted-foreground')}>
              {mission.type === 'daily' ? 'Diária' : 'Normal'}
            </span>
            {mission.type === 'daily' && (
              <span className="text-[10px] text-muted-foreground">{mission.validDays.map(d => DAY_NAMES[d]).join(', ')}</span>
            )}
            {mission.deadline && (
              <span className="text-[10px] text-muted-foreground">📅 {new Date(mission.deadline + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 text-[11px]">
            <span className="text-primary font-semibold">+{mission.xp} XP</span>
            {mission.coins > 0 && <span className="text-[hsl(var(--coin))] font-semibold">+{mission.coins} 🪙</span>}
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button onClick={onToggle} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" title={mission.active ? 'Desativar' : 'Ativar'}>
            {mission.active ? <ToggleRight className="w-4 h-4 text-[hsl(var(--success))]" /> : <ToggleLeft className="w-4 h-4" />}
          </button>
          <button onClick={onEdit} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
