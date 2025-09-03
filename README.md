# Clinky

A minimalist, command-line spaced repetition tool. `clinky` is designed for developers who are comfortable with the terminal, prefer plain text files for their data, and use Git for syncing.

## Features

-   **Plain Text Cards**: Your flashcards are simple text files, making them easy to edit, search, and manage.
-   **CLI-Based**: All operations are done through the command line, for a fast and efficient workflow.
-   **Git Sync**: Use your own Git repository to sync your cards across multiple machines.
-   **Bring Your Own Editor**: `clinky` uses your `$EDITOR` to create and edit cards.

## Installation

1.  Clone this repository:
    ```sh
    git clone https://github.com/jakethekoenig/clinky.git
    cd clinky
    ```
2.  Install dependencies:
    ```sh
    bun install
    ```
3.  Build the executable:
    ```sh
    bun build ./src/index.ts --compile --outfile clinky
    ```
4.  Move the `clinky` executable to a directory in your `$PATH`, for example:
    ```sh
    mv clinky /usr/local/bin/
    ```

## Usage

### Creating a New Card

To create a new card, run:
```sh
clinky new
```
This will open your default editor (`$EDITOR`, falls back to `vim`) with a template for your new card. The card is saved in `~/.config/clinky/cards/`.

The card format is simple:
```
Front of the card
<!---split--->
Back of the card
% Lines starting with % are comments and are ignored.
```

### Reviewing Cards

To start a review session for all due cards, run:
```sh
clinky review
```
`clinky` will show you the front of a card. Press Enter to reveal the back. After seeing the back, you'll be prompted to rate your recall:

-   `[e]asy`
-   `[m]edium`
-   `[h]ard`
-   `[a]gain`

You can also `[ed]it` the card or `[q]uit` the session at any time.

To review a specific card, provide a path to it relative to the `cards` directory:
```sh
clinky review <card_filename.txt>
```

## Configuration

`clinky` stores its data in `~/.config/clinky/` by default. You can override this by setting the `CLINKY_HOME` environment variable.

### Syncing with Git

If your `CLINKY_HOME` directory is a Git repository, `clinky` can automatically sync your changes. Create a `config.json` file in your `CLINKY_HOME` to configure this:

`~/.config/clinky/config.json`:
```json
{
    "auto_pull": true,
    "auto_push": true
}
```

-   `auto_pull`: If `true`, `clinky` will pull changes from your remote repository before creating a card or starting a review session.
-   `auto_push`: If `true`, `clinky` will commit and push changes after you create a card or complete a review session.

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
* Use typescript/bun
    * You can decide which libraries to use.
* Use sqlite for review data
* Setup github actions which check formatting/lint
* Write comprehensive tests
* Some of those tests should be e2e tests which run the cli commands and check the output
    * They should even be some tests that use git and sqlite
* Be sure to make a gitignore for artifacts that shouldn't end up in git
* After implementing all this update the README with instructions on how to use the program
