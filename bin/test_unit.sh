#!/bin/sh

# Extra args are forwarded to vitest, e.g. a file path or -t <name>.
exec npx vitest run --reporter=verbose "$@"
