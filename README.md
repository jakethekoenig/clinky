# Clinky

Vision: a cli spaced repetition program
Minimal features e.g. it will be byo editor and search tool. Cards will be plain text. Users can use git for history and sync.

## Getting Started

### Prerequisites

- Bun (https://bun.sh)
- Git (optional but recommended for sync)

### Install

- Clone this repository
- Install dependencies:
  ```
  bun install
  ```
- Build (optional; you can also run via `bun run src/cli.ts`):
  ```
  bun run build
  ```

### Usage

- Default data directory: `~/.config/clinky` (override with `CLINKY_HOME`)
- Editor for `clinky new`: `$EDITOR` (falls back to `vim`)

Commands:

```
clinky new
clinky review [path]
```

Review controls:

- Before showing the back: press Enter to continue, or `q` to quit, or `e` to edit the card in your `$EDITOR`
- After showing the back: rate your recall using numbers
  - `1 = easy`
  - `2 = medium`
  - `3 = hard`
  - `4 = again`
  - You can also press `e` to edit, or `q` to quit

Examples:

```
# Create a new card (opens $EDITOR)
CLINKY_HOME=~/.config/clinky EDITOR=nano clinky new

# Review due cards
clinky review

# Review a specific card by relative path from CLINKY_HOME
clinky review cards/1725350000.txt
```

## Full Spec

## Commands

### clinky new

Opens an editor to create a new card. Uses the EDITOR environment variable to determine which editor to use falls back to `vim`. The path for the card is CLINKY_HOME/cards/TIMESTAMP.txt where TIMESTAMP is the current unix timestamp.

### clinky review

Starts a review session for due cards. Prints the front of the card to the CLI and prompts the user to press Enter to see the back of the card.

- Before showing the back: press Enter to continue, or `q` to quit, or `e` to edit the card in your `$EDITOR`
- After showing the back: rate your recall with numbers — `1=easy`, `2=medium`, `3=hard`, `4=again`. You may also press `e` to edit or `q` to quit.

Updates the card's review schedule (SM-2 style) based on your numeric rating.

Arguments:

- path: Optional path to a specific card to review relative to CLINKY_HOME. If not provided, reviews all due cards in CLINKY_HOME.

## Storage & Format

Clinky data is stored under `~/.config/clinky/` by default, this can be overridden by setting the CLINKY_HOME environment variable. In the rest of this document we refer to this directory as `CLINKY_HOME`.

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

Review data is stored in an sqlite database at CLINKY_HOME/reviews.db.

Possible schema for the reviews table:

```sql
CREATE TABLE reviews (
    card_name TEXT NOT NULL, -- name of the card file. Note it's not the path. Cards must have unique names and moving them doesn't affect the review data.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- when the card was reviewed
    score INTEGER NOT NULL,
);
```

This is sufficient to implement a basic spaced repetition algorithm like SM-2.

### Configuration

Clinky can be configured via a config file at CLINKY_HOME/config.json. Starting configuration options:

```json
{
    "auto_pull": true // whether to automatically pull from git before starting a review session
    "auto_push": true // whether to automatically push to git after finishing a review session or creating a card
}
```

## Sync

The preferred way to synchronize clinky data is via git. If CLINKY_HOME is in a git repository then:

### auto_push

Automatically commits and pushes changes to the remote repository after creating a new card or finishing a review session. The commits message should be "Created card CARD_PATH" or "Reviewed N cards" respectively.

### auto_pull

Automatically pulls changes from the remote repository before starting a review session. And before creating a card. If there are merge conflicts, clinky should abort the operation and inform the user to resolve the conflicts manually.

## Tech decisions

Lets:

- Use typescript/bun
  - You can decide which libraries to use.
- Use sqlite for review data
- Setup github actions which check formatting/lint
- Write comprehensive tests
- Some of those tests should be e2e tests which run the cli commands and check the output
  - They should even be some tests that use git and sqlite
- Be sure to make a gitignore for artifacts that shouldn't end up in git
- After implementing all this update the README with instructions on how to use the program
