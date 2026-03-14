import { useState } from 'react';
import { Plus, Target, Edit2, Trash2, ToggleLeft, ToggleRight, Filter, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import { useGame, Mission, DAY_NAMES } from '@/contexts/GameContext';
import { CreateMissionModal } from '@/components/CreateMissionModal';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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

  // Get unique categories
  const categories = Array.from(new Set(missions.map(m => m.category))).sort();

  const filteredMissions = missions.filter(m => {
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;
    if (priorityFilter !== 'all' && m.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
    return true;
  });

  // Sort: high priority first, then by deadline
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
      <main className="container px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Missões</h1>
            <p className="text-muted-foreground">
              {missions.length} {missions.length === 1 ? 'missão criada' : 'missões criadas'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all relative',
                showFilters ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              )}
            >
              <Filter className="w-5 h-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-card rounded-xl p-4 shadow-soft space-y-3 animate-fade-in-up">
            {/* Type filter */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">Tipo</p>
              <div className="flex gap-2">
                {([['all', 'Todas'], ['normal', 'Normais'], ['daily', 'Diárias']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setTypeFilter(val)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      typeFilter === val ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority filter */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">Prioridade</p>
              <div className="flex gap-2">
                {([['all', 'Todas', null], ['high', 'Alta', ArrowUp], ['medium', 'Média', ArrowRight], ['low', 'Baixa', ArrowDown]] as const).map(([val, label, Icon]) => (
                  <button
                    key={val}
                    onClick={() => setPriorityFilter(val as PriorityFilter)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1',
                      priorityFilter === val ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    {Icon && <Icon className="w-3 h-3" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filter */}
            {categories.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Categoria</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      categoryFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    Todas
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize',
                        categoryFilter === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeFiltersCount > 0 && (
              <button
                onClick={() => { setTypeFilter('all'); setPriorityFilter('all'); setCategoryFilter('all'); }}
                className="text-xs text-destructive hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Active Missions */}
        {activeMissions.length > 0 && (
          <section>
            <h2 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
              Ativas ({activeMissions.length})
            </h2>
            <div className="space-y-3">
              {activeMissions.map((mission) => (
                <MissionItem
                  key={mission.id}
                  mission={mission}
                  onEdit={() => setEditingMission(mission)}
                  onDelete={() => setDeletingMission(mission)}
                  onToggle={() => handleToggleActive(mission)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Inactive Missions */}
        {inactiveMissions.length > 0 && (
          <section>
            <h2 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
              Inativas ({inactiveMissions.length})
            </h2>
            <div className="space-y-3 opacity-60">
              {inactiveMissions.map((mission) => (
                <MissionItem
                  key={mission.id}
                  mission={mission}
                  onEdit={() => setEditingMission(mission)}
                  onDelete={() => setDeletingMission(mission)}
                  onToggle={() => handleToggleActive(mission)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {missions.length === 0 && (
          <div className="bg-card rounded-xl p-8 text-center shadow-soft">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-2">
              Nenhuma missão criada
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comece criando sua primeira missão para ganhar EXP e moedas!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Criar Missão
            </button>
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingMission) && (
        <CreateMissionModal
          onClose={() => {
            setShowCreateModal(false);
            setEditingMission(null);
          }}
          editMission={editingMission}
        />
      )}

      {/* Delete Confirmation */}
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

function MissionItem({
  mission,
  onEdit,
  onDelete,
  onToggle,
}: {
  mission: Mission;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const PRIORITY_ICONS = {
    high: ArrowUp,
    medium: ArrowRight,
    low: ArrowDown,
  };
  const PRIORITY_COLORS = {
    high: 'text-destructive',
    medium: 'text-coin',
    low: 'text-muted-foreground',
  };
  const PIcon = PRIORITY_ICONS[mission.priority || 'medium'];

  return (
    <div className="bg-card rounded-xl p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <PIcon className={cn('w-3.5 h-3.5 flex-shrink-0', PRIORITY_COLORS[mission.priority || 'medium'])} />
            <h3 className="font-medium text-foreground">{mission.title}</h3>
          </div>
          {mission.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{mission.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs bg-secondary px-2 py-0.5 rounded-md text-muted-foreground">
              {mission.category}
            </span>
            <span className={cn(
              'text-xs font-medium',
              mission.type === 'daily' ? 'text-accent' : 'text-muted-foreground'
            )}>
              {mission.type === 'daily' ? 'Diária' : 'Normal'}
            </span>
            {mission.type === 'daily' && (
              <span className="text-xs text-muted-foreground">
                {mission.validDays.map(d => DAY_NAMES[d]).join(', ')}
              </span>
            )}
            {mission.deadline && (
              <span className="text-xs text-muted-foreground">
                📅 {new Date(mission.deadline + 'T00:00:00').toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="text-exp font-medium">+{mission.xp} EXP</span>
            {mission.coins > 0 && (
              <span className="text-coin font-medium">+{mission.coins} 🪙</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            title={mission.active ? 'Desativar' : 'Ativar'}
          >
            {mission.active ? (
              <ToggleRight className="w-5 h-5 text-success" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
