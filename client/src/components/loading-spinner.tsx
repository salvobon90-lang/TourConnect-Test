import { Logo } from "./logo";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullscreen?: boolean;
}

const sizeClasses = {
  sm: 'h-12',
  md: 'h-20',
  lg: 'h-32',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function LoadingSpinner({ 
  size = 'md', 
  text,
  fullscreen = false 
}: LoadingSpinnerProps) {
  const content = (
    <div 
      className="flex flex-col items-center justify-center gap-4"
      role="status"
      aria-label="Loading"
      data-testid="loading-spinner"
    >
      <div className="relative">
        <div className="animate-pulse-scale">
          <Logo className={sizeClasses[size]} />
        </div>
      </div>
      {text && (
        <p className={`${textSizeClasses[size]} font-medium text-muted-foreground animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {content}
      </div>
    );
  }

  return content;
}
