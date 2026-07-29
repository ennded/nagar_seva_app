import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

function FieldLabel({ label, children }: { label?: ReactNode; children: ReactNode }) {
  if (!label) return <>{children}</>;
  return (
    <label>
      {label}
      {children}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }>(
  function Input({ label, ...rest }, ref) {
    return (
      <FieldLabel label={label}>
        <input ref={ref} {...rest} />
      </FieldLabel>
    );
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: ReactNode }
>(function Textarea({ label, ...rest }, ref) {
  return (
    <FieldLabel label={label}>
      <textarea ref={ref} {...rest} />
    </FieldLabel>
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { label?: ReactNode }
>(function Select({ label, children, ...rest }, ref) {
  return (
    <FieldLabel label={label}>
      <select ref={ref} {...rest}>
        {children}
      </select>
    </FieldLabel>
  );
});
