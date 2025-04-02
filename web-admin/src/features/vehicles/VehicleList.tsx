import {
  List,
  Datagrid,
  TextField,
  ReferenceField,
  DateField,
  SearchInput,
  EditButton,
  useTranslate,
  FunctionField,
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
        <TextField source="fuel_type" />
        <FunctionField
          label="Customer"
          render={(record: any) => 
            record?.customer ? `${record.customer.user.first_name} ${record.customer.user.last_name}` : ''
          }
        />
        <DateField source="created_at" showTime />
        <EditButton />
      </Datagrid>
    </List>
  );
};

export default VehicleList; 