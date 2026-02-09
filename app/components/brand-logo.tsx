import { useId } from "react";

type BrandLogoProps = {
  textClassName?: string;
  iconSize?: number;
};

export function BrandLogo({ textClassName = "", iconSize = 36 }: BrandLogoProps) {
  const id = useId().replace(/:/g, "");
  const bgId = `logoBg-${id}`;
  const accentId = `logoAccent-${id}`;

  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id={accentId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#dbeafe" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="38" height="38" rx="10" fill={`url(#${bgId})`} />
        <path
          d="M11 14.5c0-1.4 1.1-2.5 2.5-2.5h10.8l4.2 4.2V26c0 1.4-1.1 2.5-2.5 2.5h-12.5c-1.4 0-2.5-1.1-2.5-2.5v-11.5Z"
          fill={`url(#${accentId})`}
          opacity="0.96"
        />
        <path d="M24.3 12v4.2h4.2L24.3 12Z" fill="#bfdbfe" />
        <path d="M14.5 20.2h10.8M14.5 23.8h7.5" stroke="#2563eb" strokeWidth="1.8" />
        <circle cx="29.5" cy="28.8" r="4.2" fill="#f59e0b" />
      </svg>
      <span className={textClassName || "text-lg font-semibold text-slate-900"}>ContractAI</span>
    </div>
  );
}
