# Peer-to-peer PNG sharing — notes and open questions

Written for review when you're back. Delete this file once we've talked
it through; nothing in the code depends on it.

## What I couldn't read

You pointed me at the "peer to peer PNG sharing" chat. I couldn't get to
it: the only thing under that name that this session can see is *this*
session (it's the title of the Claude Code session you started from your
phone), and there's no design note about images anywhere in the repo,
in the issue tracker, or in your Drive.

So everything below is my reading of the phrase against the codebase,
not a transcript of what you decided. If the chat settled any of these
differently, say so and I'll redo the relevant piece — the parts I'd
expect to be wrong are marked **?** below.

## What I read it to mean

"Somebody picks a PNG off their own disk and it appears on everybody
else's table, over the peer connection, with nothing hosting it."

That's the gap the code actually had: `bg_url` was a URL, so sharing your
own image meant finding a server to put it on — which the README
explicitly disclaims wanting.

## What's implemented

- `src/assets.js` — content-addressed binary store inside the Y.Doc,
  chunked, with a `tt-asset:<id>` URL scheme. Pure over Yjs, 33 unit
  tests.
- `src/image_intake.js` — decode, fit and re-encode a picked file so it
  fits the wire budget.
- Background panel: "Choose an image…" → the image becomes the table
  background for everyone.
- Import/export, and home.html's thumbnails, resolve assets.
- `src/ASSETS.md` — the design record, including §8 Dragons.
- `tests/e2e/png-share.spec.js` — proves a shared PNG reaches a second
  browser, and a third that joins afterwards.

## The judgement calls

**1. Background only, not canvas objects. ?**

This is the one I'd most like your read on. A VTT's obvious want is
"drop a map or a token on the table", not "change the tiling
background", and "PNG sharing" could easily have meant that. I built
the background path because it's the one the document already had a
field for, and because it's a complete, shippable vertical slice of the
same machinery.

The store doesn't care: an `<image>` shape in the drawing layer with
`href="tt-asset:…"` is the natural follow-up, and `drawing.js` can reach
the doc through `yFragment.doc` to resolve it. Say the word and it's a
second PR — a shape type, a placement gesture, and the resolve at render.

**2. 192 KiB per image, and images get resized to fit.**

This is the uncomfortable one, and it isn't really a choice — see
ASSETS.md §3. y-webrtc sends each Yjs update as a single data channel
message, and a peer *joining* gets the entire document as one. Chrome
refuses a message over 256 KiB. So the total document has to stay under
that, or new peers silently fail to sync.

Rather than refusing big files, `image_intake` re-encodes progressively
smaller versions until one fits, and the toast says it did. The
alternative — refuse anything over 192 KiB and make the user shrink it
themselves — is more honest but worse to use. **?** Tell me if you'd
rather refuse.

If you want real maps at real resolution, that needs an out-of-band
transfer: manifests in the document, bytes requested from whoever has
them over a channel of our own. That's a protocol, not a patch —
ASSETS.md §8 says what makes it hard.

**3. Opaque images become JPEG when they have to shrink.**

A photo re-encoded as PNG at 192 KiB looks terrible. One with an alpha
channel is never touched by that path, because JPEG would fill its
transparency with black. **?** If you'd rather everything stayed PNG,
it's one line in `encodingCandidates`.

**4. Replacing the background deletes the old image's bytes.**

Nothing else can reference an asset today, so the old one is dead weight
in every peer's copy the moment you replace it. This stops being safe
the moment a second thing can point at an asset — noted in ASSETS.md §5
and §8, and `collectUnreferenced` is there for when that day comes.

**5. A peer that has only some of an image shows the default tile.**

Not a partial image, not a broken-image icon. The Background panel shows
"Receiving from a peer — 3/7" while it's in flight.

## Things I deliberately didn't do

- No image toys, no drawing-layer images (see 1).
- No limit on total assets per document. One background at a time keeps
  it bounded by construction, not by rule.
- No Debug-panel readout of document size, which would have been useful
  for watching the budget. Small, easy to add.
- Nothing in the Peers & Sharing panel. "Sharing" there is about sharing
  the table, and an image felt like it belonged with the background.
