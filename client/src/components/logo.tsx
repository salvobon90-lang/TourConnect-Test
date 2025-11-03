interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ className = "h-8", iconOnly = false }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="TourConnect"
      className={`rounded-full ${iconOnly ? `${className} object-contain object-left` : className}`}
      style={iconOnly ? { maxWidth: '48px' } : undefined}
    />
  );
}
