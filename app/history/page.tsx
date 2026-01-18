"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HistoryPageSkeleton } from "@/components/ui/exercise-card-skeleton";
import { getRecentWorkoutSessions } from "@/lib/db";
import type { WorkoutSession } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await getRecentWorkoutSessions(20);
        setSessions(data);
      } catch (err) {
        console.error("Failed to load sessions:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSessions();
  }, []);

  if (loading) {
    return <HistoryPageSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Workout History</h1>
        <p className="text-muted-foreground">View your past workouts</p>
      </div>

      {sessions.length === 0 ? (
        <Card className="animate-scale-in">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No workouts logged yet. Start a workout to see your history here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, index) => {
            const totalSets = session.exercises.reduce(
              (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
              0
            );
            const date = new Date(session.date);

            return (
              <Card
                key={session.id}
                className="animate-slide-up transition-all duration-300 hover:shadow-md"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Week {session.weekNumber} - {session.dayName}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {date.toLocaleDateString()}
                        <Clock className="h-4 w-4 ml-2" />
                        {date.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="tabular-nums">
                        {session.exercises.length} exercises
                      </Badge>
                      <Badge
                        variant={totalSets > 0 ? "default" : "secondary"}
                        className="tabular-nums"
                      >
                        {totalSets} sets
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {session.exercises.map((ex) => {
                      const completedSets = ex.sets.filter((s) => s.completed);
                      if (completedSets.length === 0) return null;

                      return (
                        <div
                          key={ex.exerciseId}
                          className={cn(
                            "text-sm p-2 rounded-md bg-muted/50 transition-colors",
                            "hover:bg-muted"
                          )}
                        >
                          <span className="font-medium">{ex.exerciseName}</span>
                          <span className="text-muted-foreground ml-2 tabular-nums">
                            {completedSets.map((s, i) => (
                              <span key={s.setNumber}>
                                {i > 0 && ", "}
                                {s.weight}×{s.reps}
                                {s.rir !== undefined && ` @${s.rir}RIR`}
                              </span>
                            ))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
