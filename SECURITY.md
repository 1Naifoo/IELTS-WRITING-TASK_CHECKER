# Security policy

## Reporting a vulnerability

Please **don't open a public issue** for security problems.

Report them privately through GitHub: go to the repository's **Security** tab and choose **Report a vulnerability**. Include the steps to reproduce the problem and what an attacker could do with it.

You'll get a reply as soon as possible, and a fix will be released before the details are made public.

## How the app handles your data

- There is no server. The app runs in your browser.
- Your Gemini API key is stored in your browser's localStorage (or only in memory if you choose *Don't remember my key*). It is sent only to `generativelanguage.googleapis.com`.
- Results are stored in your browser's IndexedDB and never uploaded.
- The built app sets a Content Security Policy that only allows scripts from the app itself and network requests to the Gemini API.
- Never commit an API key to this repository.

## Note on the hosted site

The public site runs on `1naifoo.github.io`. Browsers keep localStorage and IndexedDB per origin, and every GitHub Pages project of the same account shares that origin. Only publish trusted pages under the same account, or run your own copy if you need full isolation.
