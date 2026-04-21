# Supabase Schema Reference

Snapshot of the `daily-sudoku` Supabase schema after migration `009_auth_and_accounts.sql`.
This is a reference doc for Claude / future contributors — the SQL migrations in
`supabase/migrations/` are the source of truth.

## Tables

### `players`
| Column                | Type         | Notes                                            |
|-----------------------|--------------|--------------------------------------------------|
| `id`                  | `uuid` PK    | Anonymous player id OR the authed player id.     |
| `created_at`          | `timestamptz`| Default `now()`.                                 |
| `current_streak`      | `int4`       | Default 0.                                       |
| `longest_streak`      | `int4`       | Default 0.                                       |
| `last_completed_date` | `date`       | Nullable.                                        |
| `username`            | `text`       | Unique (case-insensitive). Server-generated.     |
| `auth_user_id`        | `uuid`       | FK `auth.users(id)`. NULL = anonymous. Unique.   |
| `preferences`         | `jsonb`      | `{ language?: string, theme?: 'light'\|'dark' }` |

RLS: enabled. All access is through `SECURITY DEFINER` RPCs — direct table
writes are not allowed from the client.

### `completions`
| Column            | Type            | Notes                                     |
|-------------------|-----------------|-------------------------------------------|
| `id`              | `int8` PK       | Identity.                                 |
| `player_id`       | `uuid`          | FK → `players.id`.                        |
| `puzzle_number`   | `int4`          |                                           |
| `elapsed_seconds` | `int4`          |                                           |
| `mistakes`        | `int4`          |                                           |
| `solved`          | `bool`          |                                           |
| `completed_at`    | `timestamptz`   | Default `now()`.                          |

Unique: `(player_id, puzzle_number)`.

### `daily_stats`
| Column                  | Type    | Notes                   |
|-------------------------|---------|-------------------------|
| `puzzle_number`         | `int8`  | PK                      |
| `players_started`       | `int8`  |                         |
| `players_solved`        | `int8`  |                         |
| `total_completion_time` | `int8`  |                         |

## RPCs used by the client

| RPC                           | Caller role          | Purpose                                                           |
|-------------------------------|----------------------|-------------------------------------------------------------------|
| `ensure_player(p_id)`         | anon, authenticated  | Creates anon player with a server-generated unique username.       |
| `get_me()`                    | authenticated        | Returns the authed player's row, or NULL.                         |
| `link_anonymous_player(p_anon_id)` | authenticated   | Post-login merge: anon → authed. Max streaks, dedupe completions. |
| `set_preferences(p_prefs)`    | authenticated        | Merges a JSONB patch into `players.preferences`.                  |
| `record_completion(...)`      | anon, authenticated  | Records a completion + updates streak + aggregate stats.          |
| `get_puzzle_stats(...)`       | anon, authenticated  | Percentile / averages for a puzzle.                               |
| `get_streak_leaderboard(...)` | anon, authenticated  | Top N streaks + caller's rank.                                    |
| `get_speed_leaderboard(...)`  | anon, authenticated  | Fastest solvers for a puzzle.                                     |
| `increment_player_started(...)` | anon, authenticated| Bumps `daily_stats.players_started`.                              |

## Account linking — merge rules

When a user signs in with Google and the client calls `link_anonymous_player(p_anon_id)`:

- **Anon row is promoted** if the Google account has no existing linked row →
  the anon `players.id` lives on, `auth_user_id` is set to `auth.uid()`.
- **Anon row is merged** if the Google account already has a linked row (user
  already has an account on another device):
  - `current_streak` and `longest_streak` → `GREATEST` of the two rows.
  - `last_completed_date` → latest of the two.
  - Completions moved from anon → canonical, deduping on `puzzle_number` and
    keeping the **fastest** `elapsed_seconds`.
  - Anon row is deleted.
- **No anon row** → a fresh authed `players` row is created with a generated username.

## Auth provider

Google OAuth is configured via Supabase Auth (dashboard → Authentication →
Providers → Google). The client uses `supabase.auth.signInWithOAuth({ provider: 'google' })`.

## Usernames

- Assigned by the server on first `ensure_player` call.
- Unique, case-insensitive (`idx_players_username_lower`).
- Not user-editable.
- If the two-word space is saturated, generator appends a 3-digit number.
