'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Trash2, Check, AlertCircle, Pencil, X, Save, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveProgram, getAllPrograms, deleteProgram, getUserSettings, saveUserSettings } from '@/lib/db';
import type { Program } from '@/lib/types';

// Generate unique ID for exercises
function generateExerciseId(): string {
  return `ex_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// Process program to add IDs to exercises that don't have them
function processProgram(program: Program): Program {
  return {
    ...program,
    weeks: program.weeks.map(week => ({
      ...week,
      days: week.days.map(day => ({
        ...day,
        exercises: day.exercises.map(exercise => ({
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

  const loadData = useCallback(async () => {
    try {
      const [progs, settings] = await Promise.all([
        getAllPrograms(),
        getUserSettings(),
      ]);
      setPrograms(progs);
      setActiveProgramId(settings.activeProgramId || null);
    } catch (err) {
      setError('Failed to load programs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      const text = await file.text();
      const rawProgram = JSON.parse(text) as Program;

      // Validate required fields
      if (!rawProgram.name || !rawProgram.settings?.maxes || !rawProgram.weeks) {
        throw new Error('Invalid program format. Required: name, settings.maxes, weeks');
      }

      // Process program to auto-generate missing exercise IDs
      const program = processProgram(rawProgram);

      await saveProgram(program);
      await loadData();

      // Reset file input
      event.target.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse program file');
      console.error(err);
    }
  };

  const handleSetActive = async (programId: string) => {
    await saveUserSettings({ activeProgramId: programId, currentWeek: 1 });
    setActiveProgramId(programId);
  };

  const handleDelete = async (programId: string) => {
    if (!confirm('Are you sure you want to delete this program?')) return;

    await deleteProgram(programId);
    if (activeProgramId === programId) {
      await saveUserSettings({ activeProgramId: undefined, currentWeek: undefined });
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
    setEditedMaxes(prev => ({
      ...prev,
      [lift]: numValue,
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programs</h1>
          <p className="text-muted-foreground">Upload and manage your training programs</p>
        </div>
        <label htmlFor="file-upload">
          <Button asChild>
            <span>
              <Upload className="h-4 w-4 mr-2" />
              Upload Program
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

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-md">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {programs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No programs uploaded yet. Upload a JSON program file to get started.
            </p>
            <label htmlFor="file-upload-empty">
              <Button variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Program
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
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {programs.map((program) => (
            <Card key={program.id} className={activeProgramId === program.id ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {program.name}
                      {activeProgramId === program.id && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </CardTitle>
                    {program.description && (
                      <CardDescription>{program.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {activeProgramId !== program.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetActive(program.id!)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Set Active
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/programs/${program.id}/edit`)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Edit Program
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(program.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Weeks:</span>{' '}
                    <span className="font-medium">{program.weeks.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Days/Week:</span>{' '}
                    <span className="font-medium">{program.weeks[0]?.days.length || 0}</span>
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
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveMaxes(program)}
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
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>

                  {editingMaxes === program.id ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                              onChange={(e) => handleMaxChange(lift, e.target.value)}
                              className="h-8"
                            />
                            <span className="text-xs text-muted-foreground">kg</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                      {Object.entries(program.settings.maxes).map(([lift, weight]) => (
                        <div key={lift} className="flex justify-between">
                          <span className="text-muted-foreground">{lift}:</span>
                          <span className="font-medium">{weight} kg</span>
                        </div>
                      ))}
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
