'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCategories } from '@/hooks/useCategories';
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import { Transaction, TransactionType } from '@shared/types';
import { useEffect } from 'react';

const transactionSchema = z.object({
  description: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  amount: z.coerce.number().positive('O valor deve ser maior que zero'),
  type: z.custom<TransactionType>(),
  date: z.string().min(1, 'Data é obrigatória'),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
});


type TransactionFormData = {
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  categoryId: string;
};


interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Transaction | null;
}

export function TransactionModal({ isOpen, onClose, initialData }: TransactionModalProps) {
  const { data: categories } = useCategories();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty, isSubmitting }
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: 0,
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      categoryId: '',
    }
  });

  const currentType = watch('type');

  useEffect(() => {
    if (initialData) {
      reset({
        description: initialData.description,
        amount: Number(initialData.amount),
        type: initialData.type,
        date: new Date(initialData.date).toISOString().split('T')[0],
        categoryId: initialData.categoryId,
      });
    } else {
      reset({
        description: '',
        amount: 0,
        type: 'EXPENSE',
        date: new Date().toISOString().split('T')[0],
        categoryId: '',
      });
    }
  }, [initialData, isOpen, reset]);

  if (!isOpen) return null;

  async function onSubmit(data: TransactionFormData) {
    try {
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
      };

      if (isEditing && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      onClose();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {isEditing ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Descrição</label>
            <input
              {...register('description')}
              className={`mt-1 block w-full rounded-md border bg-white px-3 py-2 dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none ${
                errors.description ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'
              }`}
              placeholder="Ex: Supermercado, Salário..."
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Valor (R$)</label>
              <input
                {...register('amount', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className={`mt-1 block w-full rounded-md border bg-white px-3 py-2 dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none ${
                  errors.amount ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'
                }`}
              />
              {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Data</label>
              <input
                {...register('date')}
                type="date"
                className={`mt-1 block w-full rounded-md border bg-white px-3 py-2 dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none ${
                  errors.date ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setValue('type', 'INCOME', { shouldDirty: true })}
                className={`py-2 text-sm font-medium rounded-md border transition-all ${
                  currentType === 'INCOME' 
                    ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20' 
                    : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800'
                }`}
              >
                Receita
              </button>
              <button
                type="button"
                onClick={() => setValue('type', 'EXPENSE', { shouldDirty: true })}
                className={`py-2 text-sm font-medium rounded-md border transition-all ${
                  currentType === 'EXPENSE' 
                    ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20' 
                    : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800'
                }`}
              >
                Despesa
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Categoria</label>
            <select
              {...register('categoryId')}
              className={`mt-1 block w-full rounded-md border bg-white px-3 py-2 dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none ${
                errors.categoryId ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'
              }`}
            >
              <option value="">Selecione uma categoria</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>}
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-md hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isDirty || isSubmitting}
              className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
