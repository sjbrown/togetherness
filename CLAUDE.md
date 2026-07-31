# CLAUDE.md

Instructions for Claude working in this repo.

## Running tests

Unit tests run anywhere:

```bash
npx vitest run                          # full suite
npx vitest run tests/unit/toys.test.js  # one file
```

e2e is the part that needs setup. `bin/test.sh` and `bin/test_e2e.docker.sh`
both go through `docker compose`, which most agent sandboxes don't have.
Use the no-Docker runner instead:

```bash
bin/test_e2e.sandbox.sh                          # all specs
bin/test_e2e.sandbox.sh tests/e2e/sync.spec.js   # one spec
bin/test_e2e.sandbox.sh -g "converge"            # by name
```

It starts `serve` and `y-webrtc-signaling`, waits for them, runs Playwright,
and kills them on exit.

### What it needs

- **A Chromium binary.** Defaults to
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; override with
  `PW_CHROME`. The script fails fast with a clear message if it isn't there.
- **`--no-sandbox`.** Sandboxes run as root, where Chromium won't start
  otherwise. Already passed, both in `playwright.config.js`'s `launchOptions`
  and in each spec's own `chromium.launch()`.
- **Network.** Only localhost. `npm ci` needs registry.npmjs.org, which is
  usually on the allowlist.

### Two things that will waste your time if you don't know them

**Background processes don't survive between tool calls.** Starting a server
in one `bash` call and running tests in the next gets
`net::ERR_CONNECTION_REFUSED` — the server is already gone. Everything has to
happen in a single invocation, which is why the runner starts its own servers
rather than assuming they're up.

**The cached browser may be older than `@playwright/test` expects.** As of
writing, 1.60.0 wants build 1223 and the sandbox has 1194. Everything passes,
but a failure that reproduces here and not on your machine (or vice versa) is
worth suspecting. `npx playwright install` needs network access that usually
isn't available, so the version gap is normally the thing to work around
rather than fix.

`playwright.config.js` reads `PW_CHROME` for the default `page` fixture; specs
that call `chromium.launch()` themselves read it too. Both paths need it —
setting only one leaves a subset of tests failing on a missing executable,
which reads like a code failure and isn't.

### Run e2e when ...

End-to-end tests take a long time, and incur tool / token costs.  Be stingy
about running them.

Consider running e2e when touching rendering, the DOM/Yjs boundary,
click and pointer wiring, sync, or anything in `app.js`.
`app.js` has no unit coverage by convention, so e2e may be the only way.

## Working agreements

**Source is the owner's domain.** Update tests to match source changes, not
the reverse. Don't modify `src/` to make a test pass unless told to.

**Never reorder functions** in a file being edited. It makes diffs unreadable.

**Comments: brief or absent.** Explain the how and why of local code —
callers, callees, control flow. Don't reference the plan, the design docs, or
the current state of the migration. No `§4.2`, no "currently", no "pending".

**Small, independently landable commits**, tests green throughout.

**Verify empirically.** Write a test rather than asserting something is
correct. A suite that stays green across a change proves nothing if nothing
covered the changed code — check that coverage exists before trusting it.

**Read repository state before proposing work.** Take the owner's framing of
scope as authoritative; don't propose work that's already done.

## Orientation

Look for .md files in `src/` for the design records and commit plans.
Read these first before touching `src/*.js`

No build step. Serve `src/` as the web root, not the repo root — the app uses
absolute paths like `/lib/yjs.js`.
