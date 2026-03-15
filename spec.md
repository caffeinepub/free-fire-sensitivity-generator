# Free Fire Sensitivity Generator

## Current State
The app takes a device name input and returns a `SensitivityProfile` (general, redDot, scope2x, scope4x, sniperScope, freeLook, deviceTier) with values in the 0-200 range. Results are displayed in an animated grid of cards with progress bars.

## Requested Changes (Diff)

### Add
- **DPI Selector**: A dropdown/button group below the device input allowing the user to select their device DPI (120, 240, 360, 480, 600). Default: 240. The sensitivity values displayed should be scaled based on DPI — higher DPI = lower sensitivity (scale factor = 240 / selectedDPI). Show the DPI label clearly.
- **Fire Button Size Recommendation**: After results are shown, display a dedicated card or section recommending the ideal fire button size (Small / Medium / Large) based on the device tier:
  - Low tier → Large (easier to tap)
  - Mid tier → Medium
  - High tier → Small (more precision, more screen space)
  Include a brief explanation of why that size is recommended.

### Modify
- Results section: add the fire button size recommendation card alongside or below the sensitivity grid.
- Sensitivity card values: apply the DPI scaling factor before displaying.
- Pro Tip section: update copy to mention DPI and fire button size.

### Remove
- Nothing removed.

## Implementation Plan
1. Add a DPI selector UI (button group: 120 / 240 / 360 / 480 / 600) below the device input field, before the Generate button row.
2. Store selected DPI in state (default 240).
3. Compute `scaledValue = Math.round(rawValue * (240 / selectedDpi))` clamped to [1, 200] for each sensitivity value before rendering.
4. Add a Fire Button Size card in the results section. Derive size from `deviceTier` string (low/mid/high). Show size label, icon, and a short description.
5. Update Pro Tip copy to reference DPI and fire button size.
