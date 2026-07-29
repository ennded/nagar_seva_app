import { forwardRef, type ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'sm' | 'md';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: '',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  success: 'btn-success',
  ghost: 'btn-ghost',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, style, ...rest },
  ref,
) {
  const classes = [VARIANT_CLASS[variant], className].filter(Boolean).join(' ');
  const sizeStyle = size === 'sm' ? { minHeight: 38, padding: '0.45rem 0.85rem', fontSize: '0.85rem' } : undefined;

  return (
    <button
      ref={ref}
      className={classes || undefined}
      disabled={disabled || loading}
      style={{ ...sizeStyle, ...style }}
      {...rest}
    >
      {loading ? '…' : children}
    </button>
  );
});
