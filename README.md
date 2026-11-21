# IELTS Writing Checker

Free, open-source feedback on **IELTS Academic Writing Task 1 and Task 2**, using your own free Google Gemini API key. Nothing to install, no account, and no server that stores your work.

### 👉 [Open the app](https://1naifoo.github.io/IELTS-WRITING-TASK_CHECKER/)

`https://1naifoo.github.io/IELTS-WRITING-TASK_CHECKER/`. It works in any modern browser, on a computer or a phone.

> [!IMPORTANT]
> **This is not an official IELTS tool.** It is not affiliated with or endorsed by IELTS, IDP, the British Council or Cambridge. Scores and feedback are AI-generated estimates. They can be inaccurate or inconsistent, and they are not a reliable prediction of your real exam result. Use them for practice only, and ask a qualified teacher or examiner for an official assessment.

## The story

While I was preparing for IELTS, I kept writing Task 1 and Task 2 answers with no one to check them. I needed a way to evaluate my work: to see my band, find my mistakes and understand how to fix them. Good feedback from a teacher costs money and takes time, and most online checkers only gave me a number.

As a software engineer, I decided to build the tool I needed. I built it to help myself, and I made it free and open source to help other learners too.

— **1Naifoo**

## What you get

- An estimated band for each of the four criteria, plus an overall band
- Every mistake listed (spelling, grammar, vocabulary, cohesion, task), each with:
  - the exact words from your answer
  - why it is wrong
  - a correction
  - a better way to say it
- **Task 1:** your answer is checked against the chart data, which you confirm first
- Your strengths, and what to improve first
- Your past results, saved in your browser

---

## Before you start: get a free Gemini API key

The app uses Google's Gemini AI to check your writing. You need your own key (one time only, about 2 minutes):

1. Open **[Google AI Studio](https://aistudio.google.com/apikey)** and sign in with your Google account.
2. Click **Create API key**.
3. Copy the key (it starts with `AIza`).

It's free, and no payment details are needed.

---

## How to use

### Open the app and add your key (first time only)

1. Open **[the app](https://1naifoo.github.io/IELTS-WRITING-TASK_CHECKER/)**.
2. Click the **⚙ gear icon** at the top right.
3. Paste your key into **Paste your key**.
4. Click **Save**.
5. Wait for the green message **"Key saved and working"**.

If you see **"Key not saved"**, copy the key again from Google AI Studio and paste it again.

The key is saved in your browser, so next time just open the link.

### Check a Task 2 essay

1. Click **Home**, then click **IELTS Task 2**.
2. Paste the essay question into **The question**.
3. Paste your essay into **Your answer**.
4. Click **Submit**.
5. Wait 10–60 seconds. Your results open automatically.

### Check a Task 1 answer

1. Click **Home**, then click **IELTS Task 1**.
2. Under **Upload the chart**, click **Choose an image** and select the chart (JPG or PNG, up to 5 MB).
3. Paste the task question into **The question**.
4. Paste your answer into **Your answer**.
5. Click **Submit**.
6. Wait while Gemini reads the chart. The **Check the chart details** page opens.
7. Compare every value with your chart:
   - Rows marked **Check** (yellow) are values Gemini was unsure about. Look at these carefully.
   - To fix a value, click it and type the correct one.
   - To remove a wrong row, click **✕**. To add a missing value, click **+ Add row**.
   - If most values are wrong, click **Re-read the image** to try again.
8. When everything matches your chart, click **Looks correct, continue**.
9. Wait 10–60 seconds. Your results open automatically.

> The chart check matters: your answer is marked against the data on that page, not against the image.

### Read your results

From top to bottom, the results page shows:

1. **Your scores:** the four criteria and the **estimated overall band**
2. **Mistakes found in your answer:** spelling first, then grammar, then other issues. Use the buttons (**Spelling**, **Grammar**, …) to show one type only.
3. **Feedback for each criterion**, with a **Next step**
4. **Data accuracy** (Task 1 only): where your figures match or don't match the chart
5. **Strengths** and **What to improve first**
6. Your word count and the model used

Buttons on the results page:

| Button | What it does |
| --- | --- |
| **Evaluate again** | Checks the same answer again. The band may change slightly between runs. |
| **Start over** | Opens a new, empty form for the same task. |
| **Download details (JSON)** | Saves the full result as a file. |

### See past results

Click **Results** in the top menu to see your last 50 results. Click one to open it again; this doesn't use your Gemini quota.

---

## If something goes wrong

| Message | What to do |
| --- | --- |
| **Gemini rejected your API key** | Go to ⚙ Settings, paste the key again, and click **Save**. |
| **Your free Gemini quota … is used up** | Wait for the limit to reset (daily limits reset each day), or choose another model under **Model** in ⚙ Settings. |
| **Too many requests** | Wait one minute, then click **Try again**. |
| **Could not reach Gemini** | Check your internet connection, then click **Try again**. |

Your question and answer stay on the page when an error appears, so you don't need to paste them again.

## Privacy

- The website only delivers the app's files. Your key, answers and results are stored **only in your browser**, on your device. Clearing your browser data deletes them.
- Results are saved per browser: results saved on your laptop won't appear on your phone. To move them, use **Export** and **Import** on the **Results** page.
- Your question, answer and chart image are sent **directly to Google Gemini**, under [Google's terms](https://ai.google.dev/gemini-api/terms). Google may use free-tier requests to improve its products, so **don't include personal information** in your essays.
- **On a shared computer:** in ⚙ Settings, tick **Don't remember my key** and **Don't save my results**, and click **Clear key** when you finish.

## Limitations

- AI scores are estimates. They often run a little generous and can change between runs.
- Corrections and "better versions" are written by AI and can be wrong, so check them.
- Only Academic Task 1 is supported (no General Training letters yet).
- The scoring guidance is written in our own words. For the official band descriptors, see [ielts.org](https://ielts.org).

## How it works

<!-- GITDIAGRAM: paste the Mermaid code from https://gitdiagram.com/1Naifoo/IELTS-WRITING-TASK_CHECKER here, inside a ```mermaid block. -->

Interactive diagram of the code: **[view on GitDiagram](https://gitdiagram.com/1Naifoo/IELTS-WRITING-TASK_CHECKER)**

---

## Run it on your own computer (optional)

You don't need this to use the app. It's for people who want their own copy.

1. Install **[Node.js](https://nodejs.org/) 20 or newer** (LTS) and **[Git](https://git-scm.com/downloads)**.
2. Open a terminal (Windows: **PowerShell**; macOS: **Terminal**) and run:

   ```bash
   git clone https://github.com/1Naifoo/IELTS-WRITING-TASK_CHECKER.git
   cd IELTS-WRITING-TASK_CHECKER
   npm install
   npm start
   ```

3. The app opens at **http://localhost:4173**. Add your key in ⚙ Settings.

Press `Ctrl + C` in the terminal to stop it. Your key and results there are separate from the website's.

## For developers

```bash
npm run dev        # dev server with hot reload
npm test           # unit tests (Vitest)
npm run typecheck  # TypeScript
npm run lint       # oxlint
npm run build      # static build in dist/
```

Built with React, TypeScript, Vite, Tailwind CSS and Zod. Every push to `main` runs the tests and publishes the site to GitHub Pages (`.github/workflows/deploy.yml`).

| Path | Contents |
| --- | --- |
| `src/pages/` | Home, Task 1, Task 2, Results, History, Settings, About |
| `src/components/` | Layout, forms, chart data editor, result view |
| `src/lib/gemini/` | Gemini API client and error handling |
| `src/lib/prompts/` | Prompts and scoring guidance |
| `src/lib/issues.ts` | Removes any quoted mistake that isn't really in the essay |
| `src/lib/scoring.ts` | Overall band with IELTS rounding |
| `src/lib/storage/` | Settings (localStorage) and results (IndexedDB) |
| `src/configs/app.ts` | Default model, limits, disclaimer text |

Contributions are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md). To report a security issue, see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © 2026 1Naifoo
