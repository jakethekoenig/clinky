# Clinky

A minimalist, command-line spaced repetition tool. `clinky` is designed for developers who are comfortable with the terminal, prefer plain text files for their data, and use Git for syncing.

## Features

-   **Plain Text Cards**: Your flashcards are simple text files, making them easy to edit, search, and manage.
-   **CLI-Based**: All operations are done through the command line, for a fast and efficient workflow.
-   **Git Sync**: Use your own Git repository to sync your cards across multiple machines.
-   **Bring Your Own Editor**: `clinky` uses your `$EDITOR` to create and edit cards.

## Installation

Install globally via npm:
```sh
npm install -g clinky
```

### Development Installation

If you want to install from source:

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
