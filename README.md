# Clinky

Vision: a cli spaced repetition program
Minimal features e.g. it will be byo editor and search tool. Cards will be plain text. Users can use git for history and sync.

## Quick Start

Prereqs:

- Bun (https://bun.sh)

Install deps:

```
bun install
```

Run commands:

```
# create a new card
bun run clinky new

# start a review session
bun run clinky review

# review a specific card by path relative to CLINKY_HOME
bun run clinky review cards/1234567890.txt
```

Recommended env var:

```
export EDITOR=vim    # or nano, code -w, etc.
export CLINKY_HOME=/path/to/your/clinky/data   # optional
```

## Full Spec

## Commands

### clinky new

Opens an editor to create a new card. Uses the `EDITOR` environment variable to determine which editor to use, falls back to `vim`. The path for the card is `CLINKY_HOME/cards/TIMESTAMP.txt` where TIMESTAMP is the current unix timestamp. After creating, if `auto_push` is enabled and `CLINKY_HOME` is a git repo, Clinky commits and pushes the change.

### clinky review

Starts a review session for due cards. Prints the front of the card to the CLI and prompts the user to press Enter to see the back of the card. After showing the back, prompts the user to rate their recall: `easy`, `medium`, `hard`, `again` (shortcuts: `e/m/h/a`). You can also press `e` to edit the card at any prompt, or `q` to quit. Updates the card's review schedule (SM-2-like) based on the rating. If `auto_push` is enabled, commits and pushes after the session.

Arguments:

- path: Optional path to a specific card to review relative to `CLINKY_HOME`. If not provided, reviews all due cards in `CLINKY_HOME`.

## Storage & Format

Clinky data is stored under `~/.config/clinky/` by default; this can be overridden by setting the `CLINKY_HOME` environment variable. In the rest of this document we refer to this directory as `CLINKY_HOME`.

### Cards

Cards are stored under CLINKY_HOME/cards/. The user can use directories to organize them into decks if desired.

Each card is a plain text file with the following format:

```
Front of the card
Can be multiple lines
<!---split--->
Back of the card
% Lines starting with % are comments and ignored by clinky when printing for review.
```

Note: when you run `clinky new`, the editor will open with a template that already has the split line and comment line. The user can edit the front and back of the card as needed.

### Review Data

Review data is stored in an sqlite database at `CLINKY_HOME/reviews.db`.

Schema used:

```sql
CREATE TABLE IF NOT EXISTS reviews (
  card_name TEXT NOT NULL, -- filename only; unique per card
  created_at TEXT DEFAULT (datetime('now')),
  score INTEGER NOT NULL   -- 1 (again), 3 (hard), 4 (medium), 5 (easy)
);
```

This is sufficient to implement a basic spaced repetition algorithm like SM-2. At review time, Clinky derives the next due date from each card's history.

### Configuration

Clinky can be configured via a config file at CLINKY_HOME/config.json. Starting configuration options:

```json
{
    "auto_pull": true // whether to automatically pull from git before starting a review session
    "auto_push": true // whether to automatically push to git after finishing a review session or creating a card
}
```

## Sync

The preferred way to synchronize clinky data is via git. If `CLINKY_HOME` is in a git repository then:

### auto_push

Automatically commits and pushes changes to the remote repository after creating a new card or finishing a review session. The commit message is "Created card CARD_PATH" or "Reviewed cards".

### auto_pull

Automatically pulls changes from the remote repository before starting a review session and before creating a card. If there are merge conflicts, Clinky aborts and informs the user to resolve the conflicts manually.

## Tech decisions

- Implemented with TypeScript on Bun
- Uses `bun:sqlite` for review data
- GitHub Actions set up to check formatting (Prettier) and run tests
- Tests include unit and end-to-end; e2e tests exercise the CLI, git, and sqlite
- `.gitignore` covers common artifacts

## Development

- Run tests: `bun test`
- Lint/format: `bun run lint` and `bun run format`

## Notes

- Card files are plain text and can be freely moved/organized under `CLINKY_HOME/cards/`. Card identity is the filename.
- Comments in cards start with `%` and are not shown during review.
