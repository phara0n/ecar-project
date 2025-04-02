import {
  Create,
  SimpleForm,
  TextInput,
  ReferenceInput,
  SelectInput,
  AutocompleteInput,
  NumberInput,
  required,
  useTranslate,
} from 'react-admin';

const fuelTypes = [
  { id: 'gasoline', name: 'Gasoline' },
  { id: 'diesel', name: 'Diesel' },
  { id: 'electric', name: 'Electric' },
  { id: 'hybrid', name: 'Hybrid' },
];

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
        <SelectInput 
          source="fuel_type" 
          choices={fuelTypes}
          defaultValue="gasoline"
          validate={required()} 
          fullWidth 
        />
        <NumberInput source="mileage" defaultValue={0} fullWidth />
        <ReferenceInput source="customer_id" reference="customers">
          <AutocompleteInput 
            optionText={(record) => 
              record?.user ? `${record.user.first_name} ${record.user.last_name}` : ''
            } 
            validate={required()} 
            fullWidth 
          />
        </ReferenceInput>
      </SimpleForm>
    </Create>
  );
};

export default VehicleCreate; 