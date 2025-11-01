export function InfinityLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-glow"
    >
      <defs>
        <linearGradient id="infinityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      <path
        d="M 8 20 Q 8 12 16 12 Q 24 12 24 20 Q 24 28 16 28 Q 8 28 8 20"
        fill="none"
        stroke="url(#infinityGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 16 20 Q 16 16 20 16 Q 24 16 24 20 Q 24 24 20 24 Q 16 24 16 20"
        fill="none"
        stroke="url(#infinityGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 24 20 Q 24 12 32 12 Q 32 28 24 28 Q 32 28 32 20 Q 32 12 24 12"
        fill="none"
        stroke="url(#infinityGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="8" cy="20" r="1.5" fill="url(#infinityGradient)" opacity="0.8" />
      <circle cx="32" cy="20" r="1.5" fill="url(#infinityGradient)" opacity="0.8" />
    </svg>
  );
}
