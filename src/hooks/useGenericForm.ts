import { useState, useCallback } from 'react';

export interface FormControl {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'radio';
  label: string;
  value: string | number | boolean;
  options?: Array<{ label: string; value: string | number }>;
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    message?: string;
  };
  error?: string;
}

export interface UseGenericFormProps {
  initialControls: FormControl[];
  onSubmit: (formData: Record<string, any>) => void;
}

export const useGenericForm = ({ initialControls, onSubmit }: UseGenericFormProps) => {
  const [controls, setControls] = useState<FormControl[]>(initialControls);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const validateControl = (control: FormControl, value: any): boolean => {
    if (control.required && !value) {
      return false;
    }
    
    if (control.validation?.pattern && value) {
      return control.validation.pattern.test(String(value));
    }
    
    return true;
  };

  const handleChange = useCallback((name: string, value: any) => {
    setControls(prevControls => 
      prevControls.map(control => {
        if (control.name === name) {
          const isValid = validateControl(control, value);
          return {
            ...control,
            value,
            error: !isValid ? control.validation?.message || 'Invalid control' : undefined
          };
        }
        return control;
      })
    );
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all controls
    const updatedControls = controls.map(control => {
      const isValid = validateControl(control, control.value);
      return {
        ...control,
        error: !isValid ? control.validation?.message || 'Invalid control' : undefined
      };
    });

    setControls(updatedControls);

    // Check if any control has an error
    const hasErrors = updatedControls.some(control => control.error);
    if (hasErrors) {
      setFormError('Please fix the errors in the form');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      
      // Prepare form data
      const formData = updatedControls.reduce((acc, control) => ({
        ...acc,
        [control.name]: control.value
      }), {});
      
      await onSubmit(formData);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [controls, onSubmit]);

  return {
    controls,
    isSubmitting,
    formError,
    handleChange,
    handleSubmit,
    setControls
  };
};
