# Clinky

A CLI spaced repetition program for flashcard-based learning. Clinky uses plain text files for cards and implements the SM-2 spaced repetition algorithm to optimize your learning schedule.

## Features

- **Plain text cards**: Cards are stored as simple text files that you can edit with any editor
- **Spaced repetition**: Uses the SM-2 algorithm to schedule reviews based on your performance
- **Git integration**: Automatically sync your cards and progress using git
- **Flexible organization**: Organize cards into directories/decks as you prefer
- **Cross-platform**: Works on Linux, macOS, and Windows

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Bun](https://bun.sh/) (for development)

### Install from source

```bash
git clone <repository-url>
cd clinky
bun install
bun run build
npm link  # or add dist/index.js to your PATH
```

## Usage

### Creating Cards

Create a new flashcard:

```bash
clinky new
```

This opens your default editor (set via `EDITOR` environment variable, defaults to `vim`) with a template:

```
Front of the card
Can be multiple lines
<!---split--->
Back of the card
% Lines starting with % are comments and ignored by clinky when printing for review.
```

Edit the front and back of the card, save, and exit the editor.

### Reviewing Cards

Start a review session with all due cards:

```bash
clinky review
```

Review a specific card:

```bash
clinky review path/to/card.txt
```

During review:
- Press **Enter** to reveal the back of the card
- Rate your recall:
  - `1` or `again` - Didn't remember at all
  - `2` or `hard` - Remembered with difficulty  
  - `3` or `medium` - Remembered with some effort
  - `4` or `easy` - Remembered easily
- Type `edit` to edit the current card
- Press `q` to quit the review session

### Configuration

Clinky stores data in `~/.config/clinky/` by default. Override this with the `CLINKY_HOME` environment variable.

Configuration file (`CLINKY_HOME/config.json`):

```json
{
  "autoPull": true,  // Pull git changes before review/create
  "autoPush": true   // Push git changes after review/create
}
```

## File Structure

```
~/.config/clinky/           # Default CLINKY_HOME
├── cards/                  # Your flashcards
│   ├── 1693747200.txt     # Card files (timestamp.txt)
│   ├── math/              # Optional: organize into folders
│   │   └── algebra.txt
│   └── languages/
│       └── spanish.txt
├── config.json            # Configuration
└── reviews.db             # SQLite database with review history
```

## Card Format

Cards are plain text files with this format:

```
Front content
Multiple lines supported
<!---split--->
Back content
Also multiple lines
% Comments start with % and are ignored during review
% Use comments for hints, sources, etc.
```

## Git Integration

Initialize a git repository in your `CLINKY_HOME` to sync across devices:

```bash
cd ~/.config/clinky
git init
git remote add origin <your-repo-url>
```

With `autoPull` and `autoPush` enabled, Clinky will automatically:
- Pull changes before creating cards or starting reviews
- Commit and push changes after creating cards or finishing reviews

## Development

### Setup

```bash
git clone <repository-url>
cd clinky
bun install
```

### Available Scripts

```bash
bun run build      # Compile TypeScript
bun run dev        # Run in development mode
bun test           # Run all tests
bun run test:e2e   # Run end-to-end tests
bun run lint       # Lint code
bun run format     # Format code
```

### Project Structure

```
src/
├── commands/           # CLI command implementations
│   ├── new.ts         # Create new cards
│   └── review.ts      # Review session logic
├── lib/               # Core library functions
│   ├── cards.ts       # Card parsing and management
│   ├── config.ts      # Configuration handling
│   ├── database.ts    # SQLite database operations
│   ├── git.ts         # Git integration
│   └── spaced-repetition.ts  # SM-2 algorithm
├── __tests__/         # End-to-end tests
└── index.ts           # CLI entry point
```

### Testing

The project includes comprehensive tests:

- **Unit tests**: Test individual functions and modules
- **Integration tests**: Test component interactions
- **End-to-end tests**: Test the full CLI workflow

Run tests with:

```bash
bun test                    # All tests
bun test src/lib/__tests__/ # Unit tests only
bun run test:e2e           # E2E tests only
```

## Spaced Repetition Algorithm

Clinky implements a simplified version of the SM-2 algorithm:

1. **New cards**: Start with 1-day interval
2. **Successful reviews**: Increase interval based on ease factor
3. **Failed reviews**: Reset to short intervals
4. **Ease factor**: Adjusts based on performance (1.3 minimum)

Review ratings affect scheduling:
- **Again**: Reset progress, review tomorrow
- **Hard**: Reduce interval, lower ease factor
- **Medium**: Standard progression
- **Easy**: Increase interval more, higher ease factor

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.
