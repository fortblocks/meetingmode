export const SAMPLE_TRANSCRIPT = `Maya: Thanks for joining — let's start with last week's pipeline.
Alex: Enterprise is committed on paper, but the Acme renewal is still unsigned.
Jordan: Usage on Acme dropped 12 percent after the April cutover. They asked for a named CSM.
Maya: I can take the Acme call Thursday if someone sends the usage numbers today.
Alex: I'll send the usage export before end of day. Owner is me.
Jordan: Decision: we pause the self-serve experiment until Acme is signed.
Maya: Agreed. Open question — do we staff a fourth AE before November, or wait?
Alex: Let's park hiring until Friday's staffing meeting.
Jordan: Pricing: they want the annual at last year's rate. I did not promise that.
Maya: Do not invent a discount. Say we'll review in the Thursday call.
Alex: Follow-up email should recap the pause, the Acme call, and the unsigned renewal.
Maya: I'll send that after we hang up. Anything else before we join the customer?
Jordan: One more — legal still needs the DPA redlines. That's on Priya.
Maya: Capture it. Thanks everyone.`;

export const LIVE_DEMO_LINES: { speaker: string; text: string }[] = [
  {
    speaker: "Maya",
    text: "Thanks for joining — let's start with last week's pipeline.",
  },
  {
    speaker: "Alex",
    text: "Enterprise is committed on paper, but the Acme renewal is still unsigned.",
  },
  {
    speaker: "Jordan",
    text: "Usage on Acme dropped after the April cutover. They asked for a named CSM.",
  },
  {
    speaker: "Maya",
    text: "I can take the Acme call Thursday if someone sends the usage numbers today.",
  },
  {
    speaker: "Alex",
    text: "I'll send the usage export before end of day. That's on me.",
  },
  {
    speaker: "Jordan",
    text: "Decision: we pause the self-serve experiment until Acme is signed.",
  },
  {
    speaker: "Maya",
    text: "Agreed. Open question — do we staff a fourth AE before November, or wait?",
  },
  {
    speaker: "Alex",
    text: "Let's park hiring until Friday's staffing meeting.",
  },
  {
    speaker: "Jordan",
    text: "They want last year's annual rate. I did not promise that.",
  },
  {
    speaker: "Maya",
    text: "Don't invent a discount. We'll review pricing on the Thursday call.",
  },
  {
    speaker: "Alex",
    text: "Follow-up should recap the pause, the Acme call, and the unsigned renewal.",
  },
  {
    speaker: "Maya",
    text: "I'll send that after we hang up. Legal still needs DPA redlines from Priya.",
  },
];

export const SAMPLE_NOTES = `- Alex sending Acme usage today
- Pause self-serve until renewal is signed
- Thursday Acme call (Maya)
`;
