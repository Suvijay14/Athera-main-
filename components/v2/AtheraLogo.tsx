export default function AtheraLogo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M50 16C36 16 22 28 22 45C22 62 34 76 48 82C49.5 82.6 51.5 82.2 52.5 80.8L74 50C79 43 80 34 76 27C71.5 19 61 16 50 16ZM44 48C44 41 49 35 56 35C63 35 68 41 68 48C68 55 62 61 54 61L38 61C40 56 44 52 44 48Z"
        stroke="#244A38"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="48" r="6" fill="#244A38" />
    </svg>
  )
}
