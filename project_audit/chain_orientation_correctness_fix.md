# Chain Orientation Correctness Fix

Date: 2026-05-26

## Canonical Orientation

The Act 1 bike reads as facing right: the handlebar/front wheel are on the right, the saddle/rear wheel are on the left. Therefore the drivetrain must read as:

- rear wheel behind/left of crank
- rear sprocket/cassette centered on rear wheel
- chainring/crank forward/right of rear sprocket
- top chain span travels backward from chainring to rear sprocket
- lower chain span returns forward to chainring

## Current Fix State

`ChainRigEmbedded.tscn` already places the rear wheel and sprocket at `x = -106` and the chainring/crank at `x = 18`, which matches the canonical right-facing orientation. `ChainRig.gd` also resolves the seated chain path from the chainring back to the rear sprocket and then forward to the chainring.

## Validation Added

Added `BikeBrowserWorld/tests/chain_orientation_check.gd`.

The check verifies:

- bike facing declaration
- rear sprocket behind chainring
- rear wheel behind crank
- sprocket/rear-wheel alignment
- chain path endpoints and rear wrap
- pedal input eventually verifies the drivetrain and produces wheel spin

## Screenshots

Close-up screenshot capture is covered in the validation expansion/final capture pass. The state machine now has a dedicated orientation gate so future coordinate regressions fail before visual review.
