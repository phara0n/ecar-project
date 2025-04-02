import {
  Edit,
  SimpleForm,
  TextInput,
  ReferenceInput,
  AutocompleteInput,
  NumberInput,
  DateInput,
  BooleanInput,
  required,
  useTranslate,
} from 'react-admin';

const InvoiceEdit = () => {
  const translate = useTranslate();
  
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="id" disabled />
        <TextInput source="invoice_number" validate={required()} fullWidth />
        <ReferenceInput source="service_id" reference="services">
          <AutocompleteInput optionText="name" validate={required()} fullWidth />
        </ReferenceInput>
        <ReferenceInput source="customer_id" reference="customers">
          <AutocompleteInput optionText="name" validate={required()} fullWidth />
        </ReferenceInput>
        <NumberInput 
          source="amount" 
          validate={required()} 
          fullWidth 
        />
        <DateInput source="issued_date" validate={required()} fullWidth />
        <DateInput source="due_date" validate={required()} fullWidth />
        <BooleanInput source="paid" fullWidth />
        <DateInput source="payment_date" fullWidth />
      </SimpleForm>
    </Edit>
  );
};

export default InvoiceEdit; 