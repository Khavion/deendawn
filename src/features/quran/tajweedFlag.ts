/**
 * GATE: tajweed color-coding shows religious pronunciation rules on the Quran.
 * The rule→color mapping and rule correctness need a knowledgeable reviewer's
 * sign-off (docs/SCHOLAR_REVIEW.md) before real users see it. Until then the
 * feature is visible only in development builds (watermarked "pending review",
 * like the DEV translation badge) and is OFF in release. Flip to a plain
 * user-setting once cleared.
 */
export const TAJWEED_ENABLED = __DEV__;
