// The STRADA logo, shared by the homepage and the shop so it sits at exactly the same
// size and position on both (switching pages never moves or resizes it).
//
// pl-[calc(100vw-100%)] adds left padding equal to the scrollbar width (0 when there is none),
// which centers the logo on the full window instead of the scrollbar-narrowed page. The shop
// scrolls and the homepage doesn't, so without this the logo shifts sideways between them.
export const LOGO_HEADER_CLASS = "flex flex-col items-center pt-4 pl-[calc(100vw-100%)] md:pt-5"

export function SiteLogo() {
  return (
    <img
      src="/strada-logo.png"
      alt="STRADA"
      className="block h-28 w-28 select-none object-contain md:h-40 md:w-40"
      // Invert the white artwork to black; the snake sits left inside its PNG, so nudge it to true center
      style={{ filter: "invert(1)", mixBlendMode: "multiply", transform: "translateX(1.56%)" }}
    />
  )
}
