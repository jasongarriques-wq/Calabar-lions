export type Role = "student" | "teacher" | "school_admin" | "parent" | "alumni" | "group_admin";

export type Profile = {
  id: string;           // = auth.users.id (no separate user_id column)
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: Role;
  school_id: string | null;
  grade: number | null;
  form: string | null;
  academic_year: string | null;
  bio: string | null;
  house_id: string | null;
  approved: boolean;
  created_at: string;
  // convenience getter — falls back gracefully
  username?: string;
};

export type School = {
  id: string;
  name: string;
  parish: string;
  type: string;
  logo_url: string | null;
  created_at: string;
};

export type Subject = {
  id: string;
  name: string;
  level: "CSEC" | "CAPE" | "PEP" | "Other";
  code: string | null;
};

export type Group = {
  id: string;
  name: string;
  description: string | null;
  type: "subject" | "school" | "sba" | "club" | "house" | "general";
  school_id: string | null;
  subject_id: string | null;
  cover_url: string | null;
  member_count: number;
  is_private: boolean;
  created_by: string;
  created_at: string;
};

export type Post = {
  id: string;
  author_id: string;
  group_id: string | null;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  created_at: string;
  profiles?: Profile;
};

export type SBAProject = {
  id: string;
  student_id: string;
  subject_id: string;
  title: string;
  description: string | null;
  progress: number;
  status: "not_started" | "in_progress" | "submitted" | "graded";
  due_date: string | null;
  created_at: string;
  subjects?: Subject;
};

export type Resource = {
  id: string;
  uploader_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  subject_id: string | null;
  level: string | null;
  downloads: number;
  created_at: string;
  subjects?: Subject;
  profiles?: Profile;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  message: string;
  read: boolean;
  link: string | null;
  created_at: string;
};

export type House = {
  id: string;
  name: string;
  color: string;
  motto: string | null;
  description: string | null;
  member_count: number;
  created_at: string;
};

export type Mentor = {
  id: string;
  profile_id: string;
  graduation_year: number | null;
  industry: string | null;
  company: string | null;
  bio: string | null;
  capacity: number;
  verified: boolean;
  created_at: string;
  profiles?: Profile;
};

export type Class = {
  id: string;
  name: string;
  form: string | null;
  school_id: string | null;
  group_id: string | null;
  created_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
};

// ── Domino Game Types ──────────────────────────────────────────────────────────

export type DominoTile = [number, number];
export type PlacedTile = { tile: DominoTile; flipped: boolean; arm?: "left" | "right" | "top" | "bottom" };

export type GameMode = 'draw' | 'teams' | 'french' | 'nine-nine';
export type TableStatus = 'waiting' | 'playing' | 'blocked' | 'finished';

export type BlockedGameResult = {
  playerId: string;
  displayName: string;
  remainingPips: number;
  isWinner: boolean;
};

export type Reaction = {
  id: string;
  profileId: string;
  displayName: string;
  emoji: string;
  createdAt: string;
};

export type GameRoom = {
  id: string;
  name: string;
  max_players: number;
  current_players: number;
  points_to_win: number;
  max_rounds: number;
  status: 'waiting' | 'playing' | 'finished';
  created_by: string;
  created_at: string;
  is_private: boolean;
  invite_code?: string;
  game_mode: GameMode;
  host_name?: string;
  spectator_count: number;
};

export type GameSession = {
  id: string;
  room_id: string;
  round_number: number;
  max_rounds: number;
  current_turn: string;
  status: 'active' | 'finished' | 'series_over';
  board: PlacedTile[];
  boneyard: DominoTile[];
  left_end: number | null;
  right_end: number | null;
  scores: Record<string, number>;
  consecutive_passes: number;
  updated_at: string;
};

export type GamePlayer = {
  id: string;
  session_id: string;
  profile_id: string;
  seat: number; // 0=bottom(you), 1=left, 2=top, 3=right
  hand: DominoTile[];
  tile_count: number;
  display_name: string;
  username: string;
  score: number;
};

export type GameMessage = {
  id: string;
  room_id: string;
  profile_id: string;
  display_name: string;
  message: string;
  created_at: string;
};
