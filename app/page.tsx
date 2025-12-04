'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SBSExerciseCard } from '@/components/sbs-exercise-card';
import { RegularExerciseCard } from '@/components/regular-exercise-card';
import {
  getProgram,
  getUserSettings,
  saveUserSettings,
  saveWorkoutSession,
  getWorkoutSessionForDay,
} from '@/lib/db';
import { getSBSPrescription, type SBSPrescription } from '@/lib/sbs-calculations';
import type { Program, ExerciseLog, WorkoutSession } from '@/lib/types';

export default function WorkoutPage() {
  const [program, setProgram] = useState<Program | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [activeDay, setActiveDay] = useState<string>('');
  const [workoutSession, setWorkoutSession] = useState<WorkoutSession | null>(null);
  const [prescriptions, setPrescriptions] = useState<Record<string, SBSPrescription>>({});
  const [loading, setLoading] = useState(true);

  const loadWorkoutSession = useCallback(async (
    prog: Program,
    programId: string,
    weekNumber: number,
    dayName: string
  ) => {
    const existing = await getWorkoutSessionForDay(programId, weekNumber, dayName);

    if (existing) {
      setWorkoutSession(existing);
      return;
    }

    // Create new session
    const weekData = prog.weeks.find(w => w.week_number === weekNumber);
    const dayData = weekData?.days.find(d => d.name === dayName);

    if (!dayData) return;

    const exercises: ExerciseLog[] = dayData.exercises.map(ex => ({
      exerciseId: ex.id!, // ID is guaranteed to exist after program processing
      exerciseName: ex.name,
      type: ex.type,
      sets: [],
    }));

    const newSession: WorkoutSession = {
      programId,
      weekNumber,
      dayName,
      date: new Date(),
      exercises,
      completed: false,
      startedAt: new Date(),
    };

    setWorkoutSession(newSession);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const settings = await getUserSettings();

      if (!settings.activeProgramId) {
        setLoading(false);
        return;
      }

      const prog = await getProgram(settings.activeProgramId);
      if (!prog) {
        setLoading(false);
        return;
      }

      setProgram(prog);
      const week = settings.currentWeek || 1;
      setCurrentWeek(week);

      // Get the current week's days
      const weekData = prog.weeks.find(w => w.week_number === week);
      if (weekData && weekData.days.length > 0) {
        // Use saved day if it exists in this week, otherwise default to first day
        const savedDay = settings.currentDay;
        const dayExists = savedDay && weekData.days.some(d => d.name === savedDay);
        const dayName = dayExists ? savedDay : weekData.days[0].name;
        setActiveDay(dayName);

        // Calculate SBS prescriptions for this week
        const presc: Record<string, SBSPrescription> = {};
        for (const day of weekData.days) {
          for (const exercise of day.exercises) {
            if (exercise.type === 'sbs' && exercise.sbs_config && exercise.id) {
              presc[exercise.id] = getSBSPrescription(
                exercise.sbs_config.lift_key,
                week - 1, // 0-indexed
                prog.settings,
                settings.weightIncrement
              );
            }
          }
        }
        setPrescriptions(presc);

        // Load or create workout session for this day
        await loadWorkoutSession(prog, settings.activeProgramId, week, dayName);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [loadWorkoutSession]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDayChange = async (dayName: string) => {
    if (!program || !workoutSession) return;

    setActiveDay(dayName);
    // Persist the active day to settings
    await saveUserSettings({ currentDay: dayName });

    await loadWorkoutSession(
      program,
      workoutSession.programId,
      currentWeek,
      dayName
    );
  };

  const handleWeekChange = async (delta: number) => {
    if (!program) return;

    const newWeek = Math.max(1, Math.min(currentWeek + delta, program.weeks.length));
    if (newWeek === currentWeek) return;

    setCurrentWeek(newWeek);

    const weekData = program.weeks.find(w => w.week_number === newWeek);
    if (weekData && weekData.days.length > 0) {
      // Check if current day exists in new week, otherwise use first day
      const dayExists = weekData.days.some(d => d.name === activeDay);
      const dayName = dayExists ? activeDay : weekData.days[0].name;
      setActiveDay(dayName);

      // Save both week and day
      await saveUserSettings({ currentWeek: newWeek, currentDay: dayName });

      // Recalculate prescriptions for new week
      const settings = await getUserSettings();
      const presc: Record<string, SBSPrescription> = {};
      for (const day of weekData.days) {
        for (const exercise of day.exercises) {
          if (exercise.type === 'sbs' && exercise.sbs_config && exercise.id) {
            presc[exercise.id] = getSBSPrescription(
              exercise.sbs_config.lift_key,
              newWeek - 1,
              program.settings,
              settings.weightIncrement
            );
          }
        }
      }
      setPrescriptions(presc);

      await loadWorkoutSession(program, settings.activeProgramId!, newWeek, dayName);
    }
  };

  const handleUpdateExerciseLog = async (exerciseId: string, log: ExerciseLog) => {
    if (!workoutSession) return;

    const updatedExercises = workoutSession.exercises.map(ex =>
      ex.exerciseId === exerciseId ? log : ex
    );

    const updatedSession = {
      ...workoutSession,
      exercises: updatedExercises,
    };

    setWorkoutSession(updatedSession);

    // Auto-save the workout
    try {
      await saveWorkoutSession(updatedSession);
    } catch (err) {
      console.error('Failed to auto-save workout:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!program) {
    return (
      <div className="text-center py-12">
        <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Active Program</h2>
        <p className="text-muted-foreground mb-4">
          Upload and select a program to start your workout.
        </p>
        <Button asChild>
          <Link href="/programs">Go to Programs</Link>
        </Button>
      </div>
    );
  }

  const weekData = program.weeks.find(w => w.week_number === currentWeek);

  // Calculate completed sets for this day
  const totalCompletedSets = workoutSession?.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter(s => s.completed).length,
    0
  ) || 0;

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleWeekChange(-1)}
          disabled={currentWeek <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h1 className="text-xl font-bold">{program.name}</h1>
          <p className="text-muted-foreground">
            Week {currentWeek} of {program.weeks.length}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleWeekChange(1)}
          disabled={currentWeek >= program.weeks.length}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day Tabs */}
      {weekData && (
        <Tabs value={activeDay} onValueChange={handleDayChange}>
          <TabsList className="w-full justify-start">
            {weekData.days.map(day => (
              <TabsTrigger key={day.name} value={day.name}>
                {day.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {weekData.days.map(day => (
            <TabsContent key={day.name} value={day.name} className="space-y-4 mt-4">
              {/* Stats bar */}
              <div className="flex items-center gap-2">
                <Badge variant="outline">{day.exercises.length} exercises</Badge>
                <Badge variant={totalCompletedSets > 0 ? 'default' : 'secondary'}>
                  {totalCompletedSets} sets logged
                </Badge>
              </div>

              {/* Exercise Cards */}
              {day.exercises.map(exercise => {
                if (!exercise.id) return null;

                const exerciseLog = workoutSession?.exercises.find(
                  ex => ex.exerciseId === exercise.id
                );

                if (!exerciseLog) return null;

                if (exercise.type === 'sbs' && prescriptions[exercise.id]) {
                  return (
                    <SBSExerciseCard
                      key={exercise.id}
                      exerciseName={exercise.name}
                      prescription={prescriptions[exercise.id]}
                      exerciseLog={exerciseLog}
                      lastSetIntensity={exercise.lastSetIntensity}
                      description={exercise.description}
                      link={exercise.link}
                      alternatives={exercise.alternatives}
                      onUpdateLog={(log) => handleUpdateExerciseLog(exercise.id!, log)}
                    />
                  );
                }

                return (
                  <RegularExerciseCard
                    key={exercise.id}
                    exerciseName={exercise.name}
                    exerciseLog={exerciseLog}
                    lastSetIntensity={exercise.lastSetIntensity}
                    description={exercise.description}
                    link={exercise.link}
                    alternatives={exercise.alternatives}
                    targets={exercise.targets}
                    programId={workoutSession?.programId}
                    currentSessionId={workoutSession?.id}
                    onUpdateLog={(log) => handleUpdateExerciseLog(exercise.id!, log)}
                  />
                );
              })}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
