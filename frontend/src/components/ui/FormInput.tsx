import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  /** Slot rendered absolutely inside the input (e.g. show/hide password button). */
  trailing?: ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, id, error, trailing, className = '', type = 'text', ...rest }, ref) => {
    return (
      <div>
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
        <div className="relative">
          <input
            id={id}
            ref={ref}
            type={type}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className={
              'w-full px-3 py-2.5 rounded-lg border ' +
              'border-gray-200 dark:border-gray-700 ' +
              'bg-white dark:bg-gray-800 ' +
              'text-gray-900 dark:text-gray-100 ' +
              'placeholder:text-gray-400 ' +
              'focus:outline-none focus:ring-2 focus:ring-primary ' +
              'focus-visible:ring-2 focus-visible:ring-primary ' +
              'transition-colors duration-200 ' +
              (trailing ? 'pr-10 ' : '') +
              className
            }
            {...rest}
          />
          {trailing && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">{trailing}</div>
          )}
        </div>
        {error && (
          <p id={`${id}-error`} className="text-sm text-danger mt-1">
            {error}
          </p>
        )}
      </div>
    );
  },
);
FormInput.displayName = 'FormInput';
