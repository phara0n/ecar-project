import {
  Edit,
  SimpleForm,
  TextInput,
  ReferenceInput,
  AutocompleteInput,
  NumberInput,
  DateInput,
  SelectInput,
  required,
  useTranslate,
} from 'react-admin';

const statusChoices = [
  { id: 'pending', name: 'Pending' },
  { id: 'in_progress', name: 'In Progress' },
  { id: 'completed', name: 'Completed' },
  { id: 'cancelled', name: 'Cancelled' },
];

const ServiceEdit = () => {
  const translate = useTranslate();
  
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="id" disabled />
        <TextInput source="name" validate={required()} fullWidth />
        <TextInput source="description" multiline rows={3} fullWidth />
        <NumberInput source="price" validate={required()} fullWidth />
        <NumberInput source="duration" fullWidth />
        <ReferenceInput source="vehicle_id" reference="vehicles">
          <AutocompleteInput optionText="license_plate" validate={required()} fullWidth />
        </ReferenceInput>
        <DateInput source="service_date" validate={required()} fullWidth />
        <SelectInput source="status" choices={statusChoices} validate={required()} fullWidth />
      </SimpleForm>
    </Edit>
  );
};

export default ServiceEdit; 