---
name: Gemini try-on fidelity testing
description: Observed limitations when transferring catalogue makeup with Gemini image generation.
---

Gemini 2.5 Flash Image returned outputs, but prompt instructions to preserve identity, hair, background, and skin texture were not reliable guarantees. In a synthetic cross-tone sample, natural makeup outputs changed facial details and smoothed skin; a full-face Catrina reference copied its floral hair accessory and background rather than transferring makeup alone. Graphic-liner placement was generally closer to the intended look.

**Why:** Full-person reference thumbnails can compete with edit instructions, especially for theatrical looks.

**How to apply:** Test generated images on synthetic portraits across skin tones and distinct look types. Review identity, complexion, skin texture, hair/background, placement, and color separately. Treat prompt changes as mitigations unless output tests confirm improvement.