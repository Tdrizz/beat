type FaceStep = "base" | "brows" | "eyes" | "cheeks" | "lips";

export function LookStepDiagram({
  step,
  color,
  stepName,
}: {
  step: FaceStep;
  color?: string;
  stepName: string;
}) {
  const shade = color && color !== "transparent" ? color : "#c68e78";
  return (
    <svg
      viewBox="0 0 320 220"
      role="img"
      aria-label={`${stepName} placement diagram`}
      className="w-full h-full"
      data-testid={`diagram-${step}`}
    >
      <defs>
        <linearGradient id={`skin-${step}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3d8c4" />
          <stop offset="1" stopColor="#d7aa91" />
        </linearGradient>
      </defs>
      <rect width="320" height="220" rx="18" fill="#efe7da" />
      <path d="M40 174c8-42 33-65 69-70h102c36 5 61 28 69 70v46H40z" fill="#d7b8a1" opacity=".65" />
      <path d="M160 26c-45 0-72 37-72 87 0 54 34 83 72 83s72-29 72-83c0-50-27-87-72-87z" fill={`url(#skin-${step})`} stroke="#9b705f" strokeWidth="2" />
      <path d="M89 98c-13-5-20 3-16 17 3 10 9 16 18 15M231 98c13-5 20 3 16 17-3 10-9 16-18 15" fill="#d7aa91" stroke="#9b705f" strokeWidth="2" />
      <path d="M128 111q12-9 25 0M167 111q12-9 25 0" fill="none" stroke="#68483e" strokeWidth="3" strokeLinecap="round" />
      <path d="M135 116q8 6 15 0M170 116q8 6 15 0" fill="none" stroke="#61453b" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M160 116l-7 26q7 5 14 0" fill="none" stroke="#a77560" strokeWidth="2" strokeLinecap="round" />
      <path d="M148 157q12-6 24 0-12 12-24 0" fill="#a76d67" stroke="#87554d" strokeWidth="1.5" />

      {step === "base" && (
        <g fill={shade} opacity=".52">
          <ellipse cx="122" cy="135" rx="20" ry="12" />
          <ellipse cx="198" cy="135" rx="20" ry="12" />
          <ellipse cx="160" cy="103" rx="20" ry="11" />
          <path d="M148 123h24l8 9h-40z" />
          <path d="M109 70q51-34 102 0" fill="none" stroke={shade} strokeWidth="5" opacity=".65" />
        </g>
      )}
      {step === "brows" && (
        <g fill="none" stroke={shade} strokeWidth="5" strokeLinecap="round">
          <path d="M120 104q15-13 31-2" />
          <path d="M169 102q16-11 31 2" />
          <path d="M123 99l4 7m4-10 3 7m5-8 2 7m31-5 2 7m6-9 3 7m5-6 4 7" strokeWidth="2" />
        </g>
      )}
      {step === "eyes" && (
        <g fill={shade} opacity=".8">
          <path d="M119 114q14-17 31-2l-2 9q-16-8-29 1z" />
          <path d="M170 112q17-15 31 2l-1 8q-15-9-29-1z" />
          <path d="M115 114l-12-5 12 2m89 3 12-5-12 2" fill="none" stroke={shade} strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {step === "cheeks" && (
        <g>
          <ellipse cx="119" cy="139" rx="24" ry="13" fill={shade} opacity=".7" />
          <ellipse cx="201" cy="139" rx="24" ry="13" fill={shade} opacity=".7" />
          <path d="M114 144q-13-15-18-24M206 144q13-15 18-24" fill="none" stroke={shade} strokeWidth="2" strokeDasharray="4 4" />
        </g>
      )}
      {step === "lips" && (
        <g>
          <path d="M143 156q8-6 17 0 9-6 17 0-8 15-17 8-9 7-17-8z" fill={shade} opacity=".92" stroke={shade} strokeWidth="2" />
          <path d="M145 157h30" stroke="#fff3e9" strokeWidth="1.5" opacity=".65" />
        </g>
      )}
      <g fontFamily="sans-serif" fontSize="9" fill="#71594b" letterSpacing="1.2">
        <text x="18" y="25">PLACEMENT MAP</text>
        <text x="18" y="205">{step.toUpperCase()} · SHADE ACCENT</text>
      </g>
    </svg>
  );
}