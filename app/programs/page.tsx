"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Trash2,
  Check,
  AlertCircle,
  Pencil,
  X,
  Save,
  Settings,
  Plus,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgramsPageSkeleton } from "@/components/ui/exercise-card-skeleton";
import {
  saveProgram,
  getAllPrograms,
  deleteProgram,
  getUserSettings,
  saveUserSettings,
  getWorkoutSessionsForProgram,
} from "@/lib/db";
import type { Program } from "@/lib/types";
import { cn } from "@/lib/utils";
import { validateProgram, validateLiftKeys } from "@/lib/validation";

function generateExerciseId(): string {
  return `ex_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function processProgram(program: Program): Program {
  return {
    ...program,
    weeks: program.weeks.map((week) => ({
      ...week,
      days: week.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((exercise) => ({
          ...exercise,
          id: exercise.id || generateExerciseId(),
        })),
      })),
    })),
  };
}

export default function ProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingMaxes, setEditingMaxes] = useState<string | null>(null);
  const [editedMaxes, setEditedMaxes] = useState<Record<string, number>>({});
  const [recentlyActivated, setRecentlyActivated] = useState<string | null>(
    null
  );

  const loadData = useCallback(async () => {
    try {
      const [progs, settings] = await Promise.all([
        getAllPrograms(),
        getUserSettings(),
      ]);
      setPrograms(progs);
      setActiveProgramId(settings.activeProgramId || null);
    } catch (err) {
      setError("Failed to load programs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      const text = await file.text();
      let rawProgram;
      try {
        rawProgram = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON file. Please check the file format.");
      }

      // Validate with Zod schema
      const validation = validateProgram(rawProgram);
      if (!validation.success) {
        throw new Error(
          `Invalid program format:\n${validation.errors?.join("\n")}`
        );
      }

      // Check that all lift keys have corresponding maxes
      const liftKeyValidation = validateLiftKeys(validation.data!);
      if (!liftKeyValidation.valid) {
        throw new Error(
          `Missing maxes for lift keys: ${liftKeyValidation.missingKeys.join(", ")}\n` +
            "Add these to settings.maxes or settings.auxiliary_mapping"
        );
      }

      const program = processProgram(validation.data as Program);

      await saveProgram(program);
      await loadData();

      event.target.value = "";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to parse program file"
      );
      console.error(err);
    }
  };

  const handleImportExampleProgram = async () => {
    setError(null);

    try {
      const response = await fetch("/example-program.json");
      if (!response.ok) {
        throw new Error("Failed to load example-program.json");
      }

      const rawProgram = await response.json();

      // Validate with Zod schema
      const validation = validateProgram(rawProgram);
      if (!validation.success) {
        throw new Error(
          `Invalid program format:\n${validation.errors?.join("\n")}`
        );
      }

      const program = processProgram(validation.data as Program);

      await saveProgram(program);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to import example program"
      );
      console.error(err);
    }
  };

  const handleSetActive = async (programId: string) => {
    await saveUserSettings({ activeProgramId: programId, currentWeek: 1 });
    setActiveProgramId(programId);
    setRecentlyActivated(programId);
    setTimeout(() => setRecentlyActivated(null), 600);
  };

  const handleDelete = async (programId: string) => {
    if (!confirm("Are you sure you want to delete this program?")) return;

    await deleteProgram(programId);
    if (activeProgramId === programId) {
      await saveUserSettings({
        activeProgramId: undefined,
        currentWeek: undefined,
      });
      setActiveProgramId(null);
    }
    await loadData();
  };

  const handleEditMaxes = (program: Program) => {
    setEditingMaxes(program.id!);
    setEditedMaxes({ ...program.settings.maxes });
  };

  const handleCancelEdit = () => {
    setEditingMaxes(null);
    setEditedMaxes({});
  };

  const handleSaveMaxes = async (program: Program) => {
    const updatedProgram: Program = {
      ...program,
      settings: {
        ...program.settings,
        maxes: editedMaxes,
      },
    };

    await saveProgram(updatedProgram);
    await loadData();
    setEditingMaxes(null);
    setEditedMaxes({});
  };

  const handleMaxChange = (lift: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedMaxes((prev) => ({
      ...prev,
      [lift]: numValue,
    }));
  };

  const handleCreateNewProgram = async () => {
    const newProgram: Program = {
      name: "New Program",
      description: "",
      settings: {
        maxes: {
          Squat: 100,
          "Bench Press": 80,
          Deadlift: 120,
        },
      },
      weeks: [
        {
          week_number: 1,
          days: [
            {
              name: "Day 1",
              exercises: [
                {
                  id: generateExerciseId(),
                  name: "Exercise 1",
                  type: "regular",
                  targets: {
                    sets: "3",
                    reps: "8-12",
                    rir: "2",
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    await saveProgram(newProgram);
    const programs = await getAllPrograms();
    const savedProgram = programs[0]; // Most recent program
    if (savedProgram?.id) {
      router.push(`/programs/${savedProgram.id}/edit`);
    }
  };

  const handleExportProgram = async (program: Program) => {
    // Fetch workout sessions for this program
    const sessions = program.id
      ? await getWorkoutSessionsForProgram(program.id)
      : [];

    // Create a clean copy without internal IDs
    const exportData = {
      name: program.name,
      description: program.description,
      notes: program.notes,
      settings: program.settings,
      weeks: program.weeks.map((week) => ({
        week_number: week.week_number,
        days: week.days.map((day) => ({
          name: day.name,
          exercises: day.exercises.map((ex) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...exerciseData } = ex;
            return exerciseData;
          }),
        })),
      })),
      // Include workout history if any exists
      ...(sessions.length > 0 && {
        workoutHistory: sessions.map((session) => ({
          weekNumber: session.weekNumber,
          dayName: session.dayName,
          date: session.date,
          completed: session.completed,
          comment: session.comment,
          exercises: session.exercises.map((ex) => ({
            exerciseName: ex.exerciseName,
            type: ex.type,
            setsCompleted: ex.setsCompleted,
            notes: ex.notes,
            sets: ex.sets.map((set) => ({
              setNumber: set.setNumber,
              weight: set.weight,
              reps: set.reps,
              rir: set.rir,
              completed: set.completed,
              notes: set.notes,
            })),
          })),
        })),
      }),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${program.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <ProgramsPageSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programs</h1>
          <p className="text-muted-foreground">
            Upload and manage your training programs
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleCreateNewProgram}
            className="press-effect"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Program
          </Button>
          <Button
            onClick={handleImportExampleProgram}
            variant="outline"
            className="press-effect"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Example
          </Button>
          <label htmlFor="file-upload">
            <Button asChild variant="outline" className="press-effect">
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Upload JSON
              </span>
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-md animate-slide-down">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {programs.length === 0 ? (
        <Card className="animate-scale-in">
          <CardContent className="py-12 text-center">
            <Plus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No programs yet. Create a new program or upload a JSON file to get
              started.
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button onClick={handleCreateNewProgram} className="press-effect">
                <Plus className="h-4 w-4 mr-2" />
                Create New Program
              </Button>
              <label htmlFor="file-upload-empty">
                <Button variant="outline" asChild className="press-effect">
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload JSON
                  </span>
                </Button>
              <input
                id="file-upload-empty"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
              />
              </label>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {programs.map((program, index) => (
            <Card
              key={program.id}
              className={cn(
                "animate-slide-up transition-all duration-300",
                activeProgramId === program.id &&
                  "border-primary ring-1 ring-primary/20",
                recentlyActivated === program.id && "animate-success-pop"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 flex-wrap">
                      {program.name}
                      {activeProgramId === program.id && (
                        <Badge variant="default" className="animate-scale-in">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </CardTitle>
                    {program.description && (
                      <CardDescription>{program.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {activeProgramId !== program.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetActive(program.id!)}
                        className="press-effect"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Set Active
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/programs/${program.id}/edit`)
                      }
                      className="press-effect"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleExportProgram(program)}
                      className="press-effect"
                      title="Download as JSON"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 press-effect"
                      onClick={() => handleDelete(program.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Weeks:</span>{" "}
                    <span className="font-medium tabular-nums">
                      {program.weeks.length}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Days/Week:</span>{" "}
                    <span className="font-medium tabular-nums">
                      {program.weeks[0]?.days.length || 0}
                    </span>
                  </div>
                </div>

                {/* Maxes Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Maxes</span>
                    {editingMaxes === program.id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="press-effect"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveMaxes(program)}
                          className="press-effect"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditMaxes(program)}
                        className="press-effect"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>

                  {editingMaxes === program.id ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in">
                      {Object.entries(editedMaxes).map(([lift, weight]) => (
                        <div key={lift} className="space-y-1">
                          <Label htmlFor={`max-${lift}`} className="text-xs">
                            {lift}
                          </Label>
                          <div className="flex items-center gap-1">
                            <Input
                              id={`max-${lift}`}
                              type="number"
                              step="2.5"
                              value={weight}
                              onChange={(e) =>
                                handleMaxChange(lift, e.target.value)
                              }
                              className="h-8 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            />
                            <span className="text-xs text-muted-foreground">
                              kg
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                      {Object.entries(program.settings.maxes).map(
                        ([lift, weight]) => (
                          <div
                            key={lift}
                            className="flex justify-between p-1.5 rounded bg-muted/30"
                          >
                            <span className="text-muted-foreground">
                              {lift}:
                            </span>
                            <span className="font-medium tabular-nums">
                              {weight} kg
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
