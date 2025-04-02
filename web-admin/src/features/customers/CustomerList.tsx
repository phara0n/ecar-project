import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  SearchInput,
  EditButton,
  useTranslate,
} from 'react-admin';

const customerFilters = [
  <SearchInput source="q" alwaysOn />,
];

const CustomerList = () => {
  const translate = useTranslate();
  
  return (
    <List filters={customerFilters}>
      <Datagrid>
        <TextField source="id" />
        <TextField source="name" />
        <EmailField source="email" />
        <TextField source="phone" />
        <TextField source="address" />
        <DateField source="created_at" />
        <EditButton />
      </Datagrid>
    </List>
  );
};

export default CustomerList; 