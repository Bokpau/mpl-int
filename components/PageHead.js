// Masthead for the main list pages. The eyebrow names the current selection (the
// featured edition by default, e.g. "MSC 2025", or "All Editions" for the aggregate)
// so every page makes clear which tournament you're looking at.
export default function PageHead({ eyebrow, title, children }) {
  return (
    <div className="page-head">
      {eyebrow ? <div className="page-eyebrow">{eyebrow}</div> : null}
      <h1>{title}</h1>
      {children ? <p>{children}</p> : null}
    </div>
  );
}
