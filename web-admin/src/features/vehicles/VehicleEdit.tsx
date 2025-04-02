import {
  Edit,
  SimpleForm,
  TextInput,
  ReferenceInput,
  AutocompleteInput,
  NumberInput,
  required,
  useTranslate,
} from 'react-admin';

const VehicleEdit = () => {
  const translate = useTranslate();
  
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="id" disabled />
        <TextInput source="make" validate={required()} fullWidth />
        <TextInput source="model" validate={required()} fullWidth />
        <NumberInput source="year" validate={required()} fullWidth />
        <TextInput source="license_plate" validate={required()} fullWidth />
        <TextInput source="vin" fullWidth />
        <ReferenceInput source="customer_id" reference="customers">
          <AutocompleteInput optionText="name" validate={required()} fullWidth />
        </ReferenceInput>
      </SimpleForm>
    </Edit>
  );
};

export default VehicleEdit; 