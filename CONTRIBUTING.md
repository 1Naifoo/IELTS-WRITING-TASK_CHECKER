# Contributing

Thanks for helping! Bug reports, ideas and pull requests are welcome.

## Setup

```bash
git clone https://github.com/1Naifoo/IELTS-WRITING-TASK_CHECKER.git
cd IELTS-WRITING-TASK_CHECKER
npm install
npm run dev
```

You need Node.js 20 or newer and your own free Gemini API key (add it in the app's Settings page).

## Before opening a pull request

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

All four should pass.

## Guidelines

- Keep pull requests small and focused on one change.
- Use TypeScript and the existing Tailwind styles. Keep components simple.
- Add or update tests in `tests/` for logic changes (scoring, quote checking, error handling, storage).
- Prompts live in `src/lib/prompts/`. If you change them, describe what you tested and why the feedback is better.
- Every quoted mistake must be checked against the learner's text (`src/lib/issues.ts`). Don't remove that check.

## Content rules

- **No official IELTS, Cambridge, IDP or British Council materials.** Don't copy official band descriptors, questions or sample answers.
- Example essays and questions must be your own, synthetic, or public domain.
- Never commit API keys or personal data.

## Code of conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). By taking part, you agree to follow it.
