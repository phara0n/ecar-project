import {
  Create,
  SimpleForm,
  TextInput,
  email,
  required,
  useTranslate,
} from 'react-admin';

const CustomerCreate = () => {
  const translate = useTranslate();
  
  return (
    <Create>
      <SimpleForm>
        <TextInput source="name" validate={required()} fullWidth />
        <TextInput source="email" validate={[required(), email()]} fullWidth />
        <TextInput source="phone" fullWidth />
        <TextInput source="address" fullWidth multiline rows={3} />
      </SimpleForm>
    </Create>
  );
};

export default CustomerCreate; 