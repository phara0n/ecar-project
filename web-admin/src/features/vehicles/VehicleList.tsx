import {
  List,
  Datagrid,
  TextField,
  ReferenceField,
  DateField,
  SearchInput,
  EditButton,
  useTranslate,
} from 'react-admin';

const vehicleFilters = [
  <SearchInput source="q" alwaysOn />,
];

const VehicleList = () => {
  const translate = useTranslate();
  
  return (
    <List filters={vehicleFilters}>
      <Datagrid>
        <TextField source="id" />
        <TextField source="make" />
        <TextField source="model" />
        <TextField source="year" />
        <TextField source="license_plate" />
        <ReferenceField source="customer_id" reference="customers">
          <TextField source="name" />
        </ReferenceField>
        <DateField source="created_at" />
        <EditButton />
      </Datagrid>
    </List>
  );
};

export default VehicleList; 