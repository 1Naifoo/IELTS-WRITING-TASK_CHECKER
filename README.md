# IELTS Writing Checker

> **Not an official IELTS tool.** This project is not affiliated with or endorsed by IELTS, IDP, the British Council, or Cambridge. Scores and feedback are AI-generated estimates. They can be inaccurate or inconsistent, and they are not a reliable prediction of your real exam result. Use them for practice only, and ask a qualified teacher or examiner for an official assessment.

A free, open-source app that gives you practice feedback on **IELTS Academic Writing Task 1 and Task 2**. It runs on your own computer and uses your own free **Google Gemini** API key.

- Estimated band for each of the four IELTS Writing criteria, plus an overall band
- Every spelling, grammar, vocabulary and cohesion mistake explained, with a correction and a better version
- Task 1: Gemini reads your chart, you check and fix the data, and your answer is checked against it
- Strengths and a prioritised list of what to improve
- Past results saved in your browser, with export and import
- No account, no server, no tracking

## Quick start

You need **[Node.js](https://nodejs.org/) 20 or newer**. Check with `node -v`.

```bash
git clone https://github.com/1Naifoo/IELTS-WRITING-TASK_CHECKER.git
cd IELTS-WRITING-TASK_CHECKER
npm install
npm start
```

`npm start` builds the app and opens it in your browser (at `http://localhost:4173`). Then:

1. Click the **⚙ settings** icon.
2. Paste your Gemini API key and press **Save** (see below for how to get one).
3. Go back to **Home** and choose **IELTS Task 1** or **IELTS Task 2**.

To stop the app, press `Ctrl + C` in the terminal. To start it again later, run `npm start` in the same folder.

## Getting a free Gemini API key

1. Go to **[Google AI Studio](https://aistudio.google.com/apikey)** and sign in with a Google account.
2. Click **Create API key** and copy it.
3. Paste it in the app's **Settings** page.

The free tier needs no billing. It has limits on how many requests you can make per minute and per day; see [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits). If you run out on one model, choose another in Settings, or wait for the limit to reset.

> Google's terms may allow free-tier requests to be used to improve its products. See the [Gemini API terms](https://ai.google.dev/gemini-api/terms). Don't put personal information in your essays.

## How to use it

**Task 2 (essay):** paste the question and your essay, then press **Submit**.

**Task 1 (Academic):**
1. Upload the chart, graph, table, map or process diagram (JPG or PNG, up to 5 MB).
2. Paste the question and your answer, then press **Submit**.
3. Gemini reads the chart and shows you the data. **Check it against your chart** and fix anything wrong, then press **Looks correct, continue**. Your answer is checked against this data, so it matters.

**Results** show your estimated band, your mistakes grouped as spelling, grammar and other issues, feedback for each criterion, strengths, and what to improve first. You can **Evaluate again**, **Start over**, or **Download details** as JSON. Results are saved automatically; find them under **Results** in the menu.

## Privacy

- The app runs entirely in your browser on your computer. There is no server, account or analytics.
- Your API key, essays and results are stored only in your browser (localStorage and IndexedDB). Clearing your browser data deletes them.
- Your question, answer and chart image are sent **directly** from your browser to Google's Gemini API, under Google's terms.
- On a shared computer, tick **Don't remember my key** and **Don't save my results** in Settings, and press **Clear key** when you're done.

## Good to know

- AI band scores are estimates. They tend to be generous and can change between runs. They are not calibrated against official marking.
- Chart reading can be wrong. That's why you check the data before your answer is assessed.
- Corrections and "better versions" are written by AI and can be wrong, so check them.
- Only Academic Task 1 is supported (no General Training letters yet).
- The scoring guidance is written in our own words and follows the public criteria; it does not copy the official descriptors. For those, see the [official IELTS website](https://ielts.org).

## For developers

```bash
npm run dev        # development server with hot reload
npm test           # unit tests (Vitest)
npm run typecheck  # TypeScript
npm run lint       # oxlint
npm run build      # production build in dist/
```

Built with React, TypeScript, Vite, Tailwind CSS and Zod. The built site is static, so you can also serve the `dist` folder with any web server.

| Path | What it is |
| --- | --- |
| `src/pages/` | Home, Task 1, Task 2, Results, History, Settings, About |
| `src/components/` | Layout, forms, chart data editor, result view |
| `src/lib/gemini/` | Gemini API client and error handling |
| `src/lib/prompts/` | The prompts and scoring guidance (edit these to tune feedback) |
| `src/lib/schema.ts` | Zod schemas for what Gemini must return |
| `src/lib/issues.ts` | Checks every quoted mistake really is in the essay |
| `src/lib/scoring.ts` | Overall band with IELTS rounding |
| `src/lib/storage/` | Settings (localStorage) and saved results (IndexedDB) |
| `src/configs/app.ts` | Default model, limits, disclaimer text, links |

See [CONTRIBUTING.md](CONTRIBUTING.md) to help out, and [SECURITY.md](SECURITY.md) to report a vulnerability.

## License

[MIT](LICENSE) © 2026 1Naifoo
