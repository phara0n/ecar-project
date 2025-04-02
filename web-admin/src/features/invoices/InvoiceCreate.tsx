import {
  Create,
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

const InvoiceCreate = () => {
  const translate = useTranslate();
  
  // Generate an invoice number with current date and random number
  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}${day}-${random}`;
  };
  
  return (
    <Create>
      <SimpleForm>
        <TextInput 
          source="invoice_number" 
          validate={required()} 
          fullWidth 
          defaultValue={generateInvoiceNumber()}
        />
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
        <DateInput 
          source="issued_date" 
          validate={required()} 
          defaultValue={new Date().toISOString().split('T')[0]}
          fullWidth 
        />
        <DateInput 
          source="due_date" 
          validate={required()} 
          fullWidth 
        />
        <BooleanInput source="paid" defaultValue={false} fullWidth />
        <DateInput source="payment_date" fullWidth />
      </SimpleForm>
    </Create>
  );
};

export default InvoiceCreate; 