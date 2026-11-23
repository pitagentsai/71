import * as React from "react"

// Next bundles a React canary that ships <ViewTransition> and addTransitionType;
// the installed @types/react (v18) doesn't know them yet, so re-export them typed here.
type VTClass = string | Record<string, string>

export type ViewTransitionProps = {
  children: React.ReactNode
  name?: string
  enter?: VTClass
  exit?: VTClass
  update?: VTClass
  share?: VTClass
  default?: VTClass
}

const R = React as unknown as {
  ViewTransition: React.ComponentType<ViewTransitionProps>
  addTransitionType: (type: string) => void
}

export const ViewTransition = R.ViewTransition
export const addTransitionType = R.addTransitionType

/** Wraps a page: going forward the new page wipes up over the old one; going back is instant. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ "nav-back": "none", default: "page-in" }}
      exit={{ "nav-back": "none", default: "page-out" }}
      default="none"
    >
      <div>{children}</div>
    </ViewTransition>
  )
}
