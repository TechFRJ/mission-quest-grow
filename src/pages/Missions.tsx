import { useState } from 'react';
import { Plus, Target, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { CreateMissionModal } from '@/components/CreateMissionModal';
import { MissionCard } from '@/components/MissionCard';
import { Mission, DAY_NAMES } from '@/lib/storage';
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

export function Missions() {
  const { missions, updateMission, deleteMission } = useGame();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [deletingMission, setDeletingMission] = useState<Mission | null>(null);
  const [filter, setFilter] = useState<'all' | 'normal' | 'daily'>('all');

  const filteredMissions = missions.filter(m => {
    if (filter === 'all') return true;
    return m.type === filter;
  });

  const activeMissions = filteredMissions.filter(m => m.active);
  const inactiveMissions = filteredMissions.filter(m => !m.active);

  const handleToggleActive = (mission: Mission) => {
    updateMission(mission.id, { active: !mission.active });
  };

  const handleDelete = () => {
    if (deletingMission) {
      deleteMission(deletingMission.id);
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(['all', 'normal', 'daily'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              )}
            >
              {f === 'all' ? 'Todas' : f === 'normal' ? 'Normais' : 'Diárias'}
            </button>
          ))}
        </div>

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
  return (
    <div className="bg-card rounded-xl p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground">{mission.title}</h3>
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
          </div>
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="text-exp font-medium">+{mission.exp} EXP</span>
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
