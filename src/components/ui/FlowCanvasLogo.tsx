export function FlowCanvasLogo() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 text-primary"
      aria-hidden
    >
      <circle cx="6" cy="12" r="3" fill="currentColor" />
      <circle cx="18" cy="6" r="3" fill="currentColor" />
      <circle cx="18" cy="18" r="3" fill="currentColor" />
      <path
        d="M9 12h6M15 9l3 3M15 15l3-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
