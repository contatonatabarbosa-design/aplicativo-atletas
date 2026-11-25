export type Role = 'manager' | 'athlete'

export interface Club { id: string; name: string; slug: string; logo_url: string | null; primary_color: string; secondary_color: string }
export interface Profile { id: string; club_id: string; role: Role; full_name: string }

/** Linha da view athletes_overview. */
export interface Athlete {
  id: string; club_id: string; profile_id: string | null; full_name: string; email: string | null; phone: string | null
  birth_date: string | null; height_cm: number | null; weight_kg: number | null; bmi: number | null
  position: string | null; jersey_number: number | null; joined_at: string | null; status: 'active' | 'inactive'
  age: number | null; bmi_class: string | null; payment_status: 'paid' | 'pending'
}

export interface Playbook { id: string; title: string; scope: 'general' | 'position'; position: string | null; content: string | null; tags: string[]; media_urls: string[] }
export interface Drill { id: string; position: string; title: string; objective: string | null; instructions: string | null; media_url: string | null }
export interface DrillCompletion { id: string; drill_id: string; notes: string | null; completed_at: string }
export interface Partner { id: string; name: string; category: string | null; address: string | null; benefit: string | null }

export interface WorkoutLog {
  id: string; athlete_id: string; logged_on: string; category: 'gym' | 'performance'; exercise: string
  muscle_group: string | null; load_kg: number | null; sets: number | null; reps: number | null
  distance_m: number | null; speed_kmh: number | null; duration_seconds: number | null; notes: string | null
}
