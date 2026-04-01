import { useState } from 'react';
import { Plus, Pencil, Trash2, Link2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Wallet } from '@/hooks/useFinance';
import type { UseMutationResult } from '@tanstack/react-query';

const WALLET_TYPES = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'credit', label: 'Crédito' },
  { value: 'debit', label: 'Débito' },
  { value: 'savings', label: 'Poupança' },
] as const;

const COLOR_SWATCHES = [
  '#22c55e', '#6366f1', '#f59e0b', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b',
];

type WalletFormData = {
  name: string;
  type: string;
  balance: string;
  limit: string;
  color: string;
  linked_wallet_id: string;
};

const emptyForm: WalletFormData = {
  name: '', type: 'cash', balance: '0', limit: '', color: '#6366f1', linked_wallet_id: '',
};

interface Props {
  wallets: Wallet[];
  addWallet: UseMutationResult<void, Error, any>;
  updateWallet: UseMutationResult<void, Error, any>;
  deleteWallet: UseMutationResult<void, Error, any>;
}

export default function WalletsTab({ wallets, addWallet, updateWallet, deleteWallet }: Props) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<WalletFormData>(emptyForm);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (w: Wallet) => {
    setEditId(w.id);
    setForm({
      name: w.name,
      type: w.type,
      balance: String(w.balance),
      limit: w.limit != null ? String(w.limit) : '',
      color: w.color || '#6366f1',
      linked_wallet_id: w.linked_wallet_id || '',
    });
    setOpen(true);
  };

  const handleSave = () => {
    const payload = {
      name: form.name,
      type: form.type,
      balance: parseFloat(form.balance) || 0,
      limit: form.type === 'credit' && form.limit ? parseFloat(form.limit) : null,
      color: form.color,
      linked_wallet_id: form.linked_wallet_id || null,
    };

    if (editId) {
      updateWallet.mutate({ id: editId, ...payload }, { onSuccess: () => setOpen(false) });
    } else {
      addWallet.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  };

  const isPending = addWallet.isPending || updateWallet.isPending;

  return (
    <div className="space-y-3">
      <Button onClick={openCreate} className="w-full bg-primary text-primary-foreground" size="sm">
        <Plus className="w-4 h-4 mr-1" /> Nova Carteira
      </Button>

      {wallets.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma carteira criada</p>
      ) : (
        wallets.map(w => {
          const linked = wallets.find(lw => lw.id === w.linked_wallet_id);
          const isCredit = w.type === 'credit' && w.limit;
          const usedAmount = isCredit ? Number(w.limit) - Number(w.balance) : 0;
          const usagePct = isCredit ? (usedAmount / Number(w.limit!)) * 100 : 0;

          const progressColor =
            usagePct >= 85 ? 'bg-red-500' : usagePct >= 60 ? 'bg-amber-500' : 'bg-emerald-500';

          const typeLabel = WALLET_TYPES.find(t => t.value === w.type)?.label || w.type;

          return (
            <Card key={w.id} className="border-0 bg-card overflow-hidden">
              <div className="h-1.5" style={{ backgroundColor: w.color || '#6366f1' }} />
              <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{w.name}</p>
                    <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {typeLabel}
                    </span>
                  </div>
                  <p className="text-base font-bold text-foreground">R${Number(w.balance).toFixed(2)}</p>
                </div>

                {isCredit && (
                  <div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full transition-all rounded-full ${progressColor}`}
                        style={{ width: `${Math.min(usagePct, 100)}%` }}
                      />
                    </div>
                    <p className="text-[0.6rem] text-muted-foreground mt-0.5">
                      R${usedAmount.toFixed(0)} / R${Number(w.limit!).toFixed(0)} usado
                    </p>
                  </div>
                )}

                {linked && (
                  <p className="text-[0.6rem] text-muted-foreground flex items-center gap-1">
                    <Link2 className="w-3 h-3" /> Vinculada: {linked.name}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => openEdit(w)}>
                    <Pencil className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs text-red-500 hover:text-red-600 hover:border-red-500/50"
                    onClick={() => deleteWallet.mutate(w.id)}
                    disabled={deleteWallet.isPending}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar Carteira' : 'Nova Carteira'}</DialogTitle>
            <DialogDescription>Preencha os dados da carteira</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label className="text-xs">Nome</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Nubank" />
            </div>

            {/* Type tabs */}
            <div>
              <Label className="text-xs mb-1 block">Tipo</Label>
              <div className="grid grid-cols-4 gap-1">
                {WALLET_TYPES.map(t => (
                  <Button
                    key={t.value}
                    type="button"
                    size="sm"
                    variant={form.type === t.value ? 'default' : 'outline'}
                    className="text-xs h-8"
                    onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Balance */}
            <div>
              <Label className="text-xs">Saldo Atual</Label>
              <Input
                type="number"
                value={form.balance}
                onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            {/* Credit Limit */}
            {form.type === 'credit' && (
              <div>
                <Label className="text-xs">Limite de Crédito</Label>
                <Input
                  type="number"
                  value={form.limit}
                  onChange={e => setForm(f => ({ ...f, limit: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Linked Wallet */}
            <div>
              <Label className="text-xs">Vincular a carteira</Label>
              <select
                value={form.linked_wallet_id}
                onChange={e => setForm(f => ({ ...f, linked_wallet_id: e.target.value }))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Nenhuma</option>
                {wallets
                  .filter(w => w.id !== editId)
                  .map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
              </select>
              <p className="text-[0.6rem] text-muted-foreground mt-0.5">
                Despesas nesta carteira também descontam da carteira vinculada
              </p>
            </div>

            {/* Color */}
            <div>
              <Label className="text-xs mb-1 block">Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_SWATCHES.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={!form.name || isPending}
              className="w-full bg-primary text-primary-foreground"
            >
              {isPending ? 'Salvando...' : editId ? 'Salvar Alterações' : 'Criar Carteira'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
