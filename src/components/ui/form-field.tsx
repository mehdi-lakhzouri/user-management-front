import * as React from "react";
import { useFormContext, Controller, FieldValues, ControllerRenderProps, ControllerFieldState } from "react-hook-form";

type FieldRenderProps = ControllerRenderProps<FieldValues, string> & { error?: ControllerFieldState['error'] };

interface FormFieldProps {
  name?: string;
  label?: string;
  description?: string;
  error?: boolean;
  errorMessage?: string;
  required?: boolean;
  htmlFor?: string;
  shake?: boolean;
  children: (field: FieldRenderProps) => React.ReactNode;
}

export function FormField({
  name,
  label,
  description,
  error,
  errorMessage,
  required,
  htmlFor,
  shake,
  children,
}: FormFieldProps) {
  const { control } = useFormContext();

  let fieldNode: React.ReactNode;
  if (name && control) {
    fieldNode = (
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => {
          const node = children({ ...field, error: fieldState.error });
          return React.isValidElement(node) ? node : <></>;
        }}
      />
    );
  } else {
    const node = children({} as FieldRenderProps);
    fieldNode = React.isValidElement(node) ? node : <></>;
  }

  return (
    <div className={`space-y-1 ${shake ? 'animate-shake' : ''}`}>
      {label && (
        <label
          htmlFor={htmlFor || name}
          className={`block text-sm font-medium ${required ? 'after:content-["*"] after:ml-0.5 after:text-destructive' : ''}`}
        >
          {label}
        </label>
      )}
      {description && (
        <div className="text-xs text-muted-foreground mb-1">{description}</div>
      )}
      {fieldNode}
      {(error || errorMessage) && (
        <div className="text-xs text-destructive mt-1">{errorMessage}</div>
      )}
    </div>
  );
}
