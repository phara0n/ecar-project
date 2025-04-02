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
  
  const transform = (data: any) => {
    // Create a modified version of the data for submission
    // The dataProvider will handle the user nesting, but we need
    // to transform the React Admin form fields into what the dataProvider expects
    const { first_name, last_name, email: user_email, ...rest } = data;
    
    return {
      ...rest,
      name: `${first_name} ${last_name}`.trim(),
      email: user_email,
    };
  };
  
  return (
    <Create transform={transform}>
      <SimpleForm>
        <TextInput source="first_name" label="First Name" validate={required()} fullWidth />
        <TextInput source="last_name" label="Last Name" validate={required()} fullWidth />
        <TextInput source="email" label="Email" validate={[required(), email()]} fullWidth />
        <TextInput source="phone" validate={required()} fullWidth />
        <TextInput source="address" fullWidth multiline rows={3} />
      </SimpleForm>
    </Create>
  );
};

export default CustomerCreate; 