const customValidation = [
  {
    weight: 3,
    type: 'checkbox',
    label: 'Required',
    tooltip:
      'A required field must be filled in before the form can be submitted.',
    key: 'validate.required',
    input: true,
  },
  {
    weight: 200,
    key: 'validate.customMessage',
    label: 'Custom Error Message',
    placeholder: 'Custom Error Message',
    type: 'textfield',
    tooltip: 'Error message displayed if any error occurred.',
    input: true,
  },
];
export default {
  key: 'customValidation',
  label: 'Validation',
  weight: 10,
  components: customValidation,
};
