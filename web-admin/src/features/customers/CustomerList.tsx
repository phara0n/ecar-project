import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  SearchInput,
  EditButton,
  useTranslate,
  FunctionField,
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
        <FunctionField
          label="Name"
          render={(record: any) => 
            record?.user ? `${record.user.first_name} ${record.user.last_name}` : ''
          }
        />
        <FunctionField
          label="Email"
          render={(record: any) => 
            record?.user ? record.user.email : ''
          }
        />
        <TextField source="phone" />
        <TextField source="address" />
        <DateField source="created_at" />
        <EditButton />
      </Datagrid>
    </List>
  );
};

export default CustomerList; 