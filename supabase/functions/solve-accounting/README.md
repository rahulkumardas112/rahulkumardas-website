# AI Accounting Solver setup

The frontend is `accounting-solver.html`. The deployed Supabase Edge Function is `solve-accounting`.

## Required one-time step

In the Supabase dashboard for project `ucehhsythixyvhrzwlth`, open Edge Functions, then Secrets, and add:

- Name: `OPENAI_API_KEY`
- Value: your own OpenAI API key from the OpenAI developer platform

Never put the secret key in this repository, in `index.html`, or in any browser JavaScript.

The function uses the server-side secret and the existing Supabase Auth session. It accepts typed questions and JPG, PNG or WebP question images. The database stores users' text questions and answers, with row-level security restricting history to the owning user. Image files are not stored in history.

## Initial usage protection

The backend enforces up to five successful or attempted solution requests per signed-in account per day. A request can consume quota even if the AI provider returns an error after the quota reservation. Monitor usage and configure spending limits in the OpenAI developer platform before promoting the feature.

## Test checklist

1. Add the `OPENAI_API_KEY` secret in Supabase.
2. Sign in to `https://rahulkumardas.in/account.html`.
3. Open `https://rahulkumardas.in/accounting-solver.html`.
4. Submit a short typed accounting question.
5. Submit a clear image of a question.
6. Refresh the page and confirm saved history appears.
7. Confirm one user's history is not visible from another account.
