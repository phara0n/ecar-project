import {
  Create,
  SimpleForm,
  TextInput,
  ReferenceInput,
  AutocompleteInput,
  NumberInput,
  required,
  useTranslate,
} from 'react-admin';

const VehicleCreate = () => {
  const translate = useTranslate();
  
  return (
    <Create>
      <SimpleForm>
        <TextInput source="make" validate={required()} fullWidth />
        <TextInput source="model" validate={required()} fullWidth />
        <NumberInput source="year" validate={required()} fullWidth />
        <TextInput source="license_plate" validate={required()} fullWidth />
        <TextInput source="vin" fullWidth />
        <ReferenceInput source="customer_id" reference="customers">
          <AutocompleteInput optionText="name" validate={required()} fullWidth />
        </ReferenceInput>
      </SimpleForm>
    </Create>
  );
};

export default VehicleCreate; 