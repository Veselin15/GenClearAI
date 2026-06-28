import Image from "next/image";
import Link from "next/link";

export const BRAND_ICON = "/brand/logo.png";
export const BRAND_LOGO = "/brand/logo-text.png";

interface BrandLogoProps {
  /** Icon mark only, or full wordmark lockup */
  variant?: "icon" | "full";
  className?: string;
  priority?: boolean;
  /** Text beside the icon mark (nav / app chrome) */
  showWordmark?: boolean;
}

export function BrandLogo({
  variant = "icon",
  className = "",
  priority,
  showWordmark = true,
}: BrandLogoProps) {
  if (variant === "full") {
    return (
      <Image
        src={BRAND_LOGO}
        alt="GenClear"
        width={240}
        height={130}
        className={`brand-logo brand-logo-full ${className}`.trim()}
        priority={priority}
      />
    );
  }

  return (
    <>
      <Image
        src={BRAND_ICON}
        alt=""
        width={32}
        height={32}
        className={`brand-logo brand-logo-icon ${className}`.trim()}
        aria-hidden
        priority={priority}
      />
      {showWordmark && <span className="brand-wordmark">GenClear</span>}
    </>
  );
}

interface BrandLinkProps extends BrandLogoProps {
  href?: string;
}

export function BrandLink({
  variant = "icon",
  className = "",
  priority,
  showWordmark = true,
  href = "/",
}: BrandLinkProps) {
  return (
    <Link className={`brand ${className}`.trim()} href={href} aria-label="GenClear home">
      <BrandLogo
        variant={variant}
        priority={priority}
        showWordmark={variant === "icon" && showWordmark}
      />
    </Link>
  );
}
