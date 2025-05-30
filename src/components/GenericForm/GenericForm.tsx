import { useGenericForm, type FormControl } from '../../hooks/useGenericForm';
import './GenericForm.css';

export type InputControlType = 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea';

export interface GenericFormControl extends Omit<FormControl, 'type'> {
  type: InputControlType;
}

interface GenericFormProps {
  initialControls: GenericFormControl[];
  onSubmit: (formData: Record<string, any>) => Promise<void> | void;
  submitButtonText?: string;
  className?: string;
}

const GenericForm = ({
  initialControls,
  onSubmit,
  submitButtonText = 'Submit',
  className = ''
}: GenericFormProps) => {
  const {
    controls,
    isSubmitting,
    formError,
    handleChange,
    handleSubmit
  } = useGenericForm({ 
    initialControls: initialControls as FormControl[], 
    onSubmit 
  });

  const handleControlChange = (
    control: GenericFormControl, 
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = control.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.value;
    handleChange(control.name, value);
  };

  const renderControl = (control: GenericFormControl) => {
    const commonProps = {
      id: control.name,
      name: control.name,
      value: control.value as string | number | readonly string[] | undefined,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => 
        handleControlChange(control, e),
      disabled: isSubmitting,
      className: `form-control ${control.error ? 'error' : ''}`,
      required: control.required,
    };

    return (
      <div key={control.name} className="form-group">
        <label htmlFor={control.name}>
          {control.label}
          {control.required && <span className="required">*</span>}
        </label>
        
        {control.type === 'select' ? (
          <select {...commonProps}>
            {control.options?.map((option: { label: string; value: string | number }) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : control.type === 'textarea' ? (
          <textarea
            {...commonProps}
            value={control.value as string}
            onChange={(e) => handleControlChange(control, e)}
            rows={4}
          />
        ) : ['checkbox', 'radio'].includes(control.type) ? (
          <input
            type={control.type as 'checkbox' | 'radio'}
            checked={!!control.value}
            onChange={(e) => handleControlChange(control, e)}
            disabled={isSubmitting}
            className={control.error ? 'error' : ''}
          />
        ) : (
          <input
            type={control.type as 'text' | 'email' | 'password' | 'number'}
            {...commonProps}
          />
        )}
        
        {control.error && <div className="error-message">{control.error}</div>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={`generic-form ${className}`}>
      {controls.map((control) => renderControl(control as GenericFormControl))}
      
      {formError && (
        <div className="form-error">
          {formError}
        </div>
      )}
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="submit-button"
      >
        {isSubmitting ? 'Submitting...' : submitButtonText}
      </button>
    </form>
  );
};

export default GenericForm;