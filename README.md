# Clinky

Vision: a cli spaced repetition program
Minimal features e.g. it will be byo editor and search tool. Cards will be plain text. Users can use git for history and sync.

# Full Spec

## Commands

### clinky new

Opens an editor to create a new card. Uses the EDITOR environment variable to determine which editor to use falls back to `vim`. The path for the card is CLINKY_HOME/cards/TIMESTAMP.txt where TIMESTAMP is the current unix timestamp.

### clinky review

Starts a review session for due cards. Prints the front of the card to the cli and prompts the user to press enter to see the back of the card. After showing the back of the card, prompts the user to rate their recall, easy, medium, hard, again. Updates the card's review schedule based on the user's rating. Can also enter e to edit the card and q to quit (before or after seeing the back).

Arguments:
* path: Optional path to a specific card to review relative to CLINKY_HOME. If not provided, reviews all due cards in CLINKY_HOME.

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

### Review Data

Review data is stored in an sqlite database at CLINKY_HOME/reviews.db.

Possible schema for the reviews table:

```sql
CREATE TABLE reviews (
    card_path TEXT NOT NULL, -- path to the card file relative to CLINKY_HOME/cards/
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- when the card was reviewed
    score INTEGER NOT NULL,
);
```

This is sufficient to implement a basic spaced repetition algorithm like SM-2.

### Configuration

Clinky can be configured via a config file at CLINKY_HOME/config.json. Possible configuration options:
```json
{
    "editor": "vim", // default editor to use for creating/editing cards
    "review_limit": 20 // maximum number of cards to review in a single session
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
* Use typescript/bun
* Use sqlite for review data
* Setup github actions which check formatting/lint
* Write comprehensive tests
* Some of those tests should be e2e tests which run the cli commands and check the output
    * They should even be some tests that use git and sqlite
* Be sure to make a gitignore for artifacts that shouldn't end up in git
