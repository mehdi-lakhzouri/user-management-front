import * as React from "react";

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  errorMessage?: string;
  shake?: boolean;
}

export const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ error, errorMessage, shake, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`transition-all duration-200 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 ${
          error ? 'border-destructive' : 'border-border'
        } ${shake ? 'animate-shake' : ''} ${className}`}
        aria-invalid={error}
        aria-describedby={error && errorMessage ? `${props.id}-error` : undefined}
        {...props}
      />
    );
  }
);
AnimatedInput.displayName = 'AnimatedInput';
