import { Benchmark } from "./components/Benchmark/Benchmark";
import GenericForm, { type GenericFormControl } from "./components/GenericForm/GenericForm";

function App() {
  const initialControls: GenericFormControl[] = [
    {
      name: 'name',
      type: 'text',
      label: 'Full Name',
      value: '',
      required: true,
      validation: {
        pattern: /^[a-zA-Z\s]{2,50}$/,
        message: 'Please enter a valid name (2-50 characters, letters only)'
      }
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
      value: '',
      required: true,
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
      }
    },
    {
      name: 'password',
      type: 'password',
      label: 'Password',
      value: '',
      required: true,
      validation: {
        pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
        message: 'Password must be at least 8 characters with at least one letter and one number'
      }
    },
    {
      name: 'age',
      type: 'number',
      label: 'Age',
      value: '',
      validation: {
        pattern: /^[1-9]\d*$/,
        message: 'Please enter a valid age'
      }
    },
    {
      name: 'gender',
      type: 'select',
      label: 'Gender',
      value: '',
      options: [
        { label: 'Select gender...', value: '' },
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Other', value: 'other' }
      ]
    },
    {
      name: 'subscribe',
      type: 'checkbox',
      label: 'Subscribe to newsletter',
      value: false
    }
  ];

  const handleSubmit = async (formData: Record<string, any>) => {
    console.log('Form submitted:', formData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Form submitted successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Generic Form Demo
        </h1>
        
        {/* <Benchmark componentId="GenericForm"> */}
          {/* <div className="bg-white p-6 rounded-lg shadow-md"> */}
            <GenericForm 
              initialControls={initialControls}
              onSubmit={handleSubmit}
              submitButtonText="Submit Form"
              className="space-y-6"
            />
          {/* </div> */}
        {/* </Benchmark> */}
      </div>
    </div>
  );
}

export default App;
