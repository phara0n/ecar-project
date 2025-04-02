import {
  Edit,
  SimpleForm,
  TextInput,
  email,
  required,
  useTranslate,
} from 'react-admin';

const CustomerEdit = () => {
  const translate = useTranslate();
  
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="id" disabled />
        <TextInput source="name" validate={required()} fullWidth />
        <TextInput source="email" validate={[required(), email()]} fullWidth />
        <TextInput source="phone" fullWidth />
        <TextInput source="address" fullWidth multiline rows={3} />
      </SimpleForm>
    </Edit>
  );
};

export default CustomerEdit; 