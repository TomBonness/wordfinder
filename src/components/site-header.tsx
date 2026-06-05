import Link from "next/link";

const navItems = [
  { href: "/", label: "search" },
  { href: "/#curve-heading", label: "curve" },
  { href: "/#activity-heading", label: "activity" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Word Finder home">
        <span className="brand-mark">WF</span>
        <span>word finder</span>
      </Link>
      <nav className="nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
