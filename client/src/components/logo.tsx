import logoImage from "@assets/ChatGPT Image 8 ott 2025, 11_24_30_1761585676193.png";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ className = "h-8", iconOnly = false }: LogoProps) {
  return (
    <img
      src={logoImage}
      alt="TourConnect"
      className={iconOnly ? `${className} object-contain object-left` : className}
      style={iconOnly ? { maxWidth: '48px' } : undefined}
    />
  );
}
