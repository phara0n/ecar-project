import {
  List,
  Datagrid,
  TextField,
  ReferenceField,
  DateField,
  NumberField,
  SearchInput,
  EditButton,
  useTranslate,
  ChipField,
} from 'react-admin';

const serviceFilters = [
  <SearchInput source="q" alwaysOn />,
];

const ServiceList = () => {
  const translate = useTranslate();
  
  return (
    <List filters={serviceFilters}>
      <Datagrid>
        <TextField source="id" />
        <TextField source="name" />
        <NumberField source="price" options={{ style: 'currency', currency: 'USD' }} />
        <ReferenceField source="vehicle_id" reference="vehicles">
          <TextField source="license_plate" />
        </ReferenceField>
        <DateField source="service_date" />
        <ChipField source="status" />
        <DateField source="created_at" />
        <EditButton />
      </Datagrid>
    </List>
  );
};

export default ServiceList; 