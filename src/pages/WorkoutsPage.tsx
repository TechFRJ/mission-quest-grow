import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StartWorkoutTab from '@/components/workouts/StartWorkoutTab';
import WorkoutHistoryTab from '@/components/workouts/WorkoutHistoryTab';
import { Dumbbell } from 'lucide-react';

export default function WorkoutsPage() {
  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Treinos</h1>
        </div>

        <Tabs defaultValue="start" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="start">Iniciar Treino</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          <TabsContent value="start">
            <StartWorkoutTab />
          </TabsContent>
          <TabsContent value="history">
            <WorkoutHistoryTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
