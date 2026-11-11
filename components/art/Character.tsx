/** A simple friendly illustrated character (head + shoulders). */
export default function Character({ hoodie = "#8B5CF6", className = "" }: { hoodie?: string; className?: string }) {
  const hair = "#2A1A22";
  return (
    <svg viewBox="0 0 200 240" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden="true">
      <path d="M46 112C38 36 162 36 154 112L160 192C130 204 70 204 40 192Z" fill={hair} />
      <path d="M18 240C18 192 56 172 100 172s82 20 82 68Z" fill={hoodie} />
      <path d="M68 176c10 22 54 22 64 0-12-5-52-5-64 0Z" fill="#000" opacity=".18" />
      <rect x="86" y="140" width="28" height="40" rx="12" fill="#EFB293" />
      <ellipse cx="100" cy="106" rx="40" ry="46" fill="#F7C6A8" />
      <path d="M58 102C58 54 142 50 142 102 128 84 110 74 92 66 80 82 66 94 58 102Z" fill={hair} />
      <path d="M52 100c-8 40-6 76-14 98l24-6c-4-28-2-58 0-90Z" fill={hair} />
      <path d="M148 100c8 40 6 76 14 98l-24-6c4-28 2-58 0-90Z" fill={hair} />
      <ellipse cx="85" cy="110" rx="4" ry="5.5" fill="#2b1b17" />
      <ellipse cx="115" cy="110" rx="4" ry="5.5" fill="#2b1b17" />
      <circle cx="86.6" cy="108" r="1.5" fill="#fff" />
      <circle cx="116.6" cy="108" r="1.5" fill="#fff" />
      <path d="M78 98q7-5 14-1M108 97q7-4 14 1" stroke={hair} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="73" cy="124" r="7" fill="#F28B9B" opacity=".35" />
      <circle cx="127" cy="124" r="7" fill="#F28B9B" opacity=".35" />
      <path d="M88 126q12 13 24 0Z" fill="#fff" stroke="#B5473A" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}
