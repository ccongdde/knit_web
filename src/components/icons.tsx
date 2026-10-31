import type { SVGProps } from 'react'

function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

type P = SVGProps<SVGSVGElement>

export const BookIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z" />
    <path d="M8 17h11" />
  </Icon>
)

export const BoxIcon = (p: P) => (
  <Icon {...p}>
    <path d="M3 8l9-5 9 5v8l-9 5-9-5V8z" />
    <path d="M3 8l9 5 9-5M12 13v8" />
  </Icon>
)

export const SlidersIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </Icon>
)

export const PlusIcon = (p: P) => (
  <Icon strokeWidth="2" {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

export const SearchIcon = (p: P) => (
  <Icon strokeWidth="2" {...p}>
    <circle cx="11" cy="11" r="6" />
    <path d="M20 20l-4-4" />
  </Icon>
)

export const ChevronLeftIcon = (p: P) => (
  <Icon strokeWidth="2" {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
)

export const ChevronRightIcon = (p: P) => (
  <Icon strokeWidth="2" {...p}>
    <path d="M9 5l7 7-7 7" />
  </Icon>
)

export const CloseIcon = (p: P) => (
  <Icon strokeWidth="2" {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
)
