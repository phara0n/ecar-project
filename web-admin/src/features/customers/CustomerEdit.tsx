import {
  Edit,
  SimpleForm,
  TextInput,
  email,
  required,
  useTranslate,
  FormDataConsumer,
} from 'react-admin';

const CustomerEdit = () => {
  const translate = useTranslate();
  
  const transform = (data: any) => {
    // Create a modified version of the data for submission
    // The dataProvider will handle the user nesting, but we need
    // to transform the React Admin form fields into what the dataProvider expects
    const { user_first_name, user_last_name, user_email, ...rest } = data;
    
    return {
      ...rest,
      name: `${user_first_name} ${user_last_name}`.trim(),
      email: user_email,
    };
  };
  
  return (
    <Edit transform={transform}>
      <SimpleForm>
        <TextInput source="id" disabled />
        
        <FormDataConsumer>
          {({ formData, ...rest }) => (
            <>
              <TextInput 
                source="user_first_name" 
                label="First Name"
                defaultValue={formData?.user?.first_name || ''}
                validate={required()} 
                fullWidth 
                {...rest}
              />
              <TextInput 
                source="user_last_name" 
                label="Last Name"
                defaultValue={formData?.user?.last_name || ''}
                validate={required()} 
                fullWidth 
                {...rest}
              />
              <TextInput 
                source="user_email" 
                label="Email"
                defaultValue={formData?.user?.email || ''}
                validate={[required(), email()]} 
                fullWidth 
                {...rest}
              />
            </>
          )}
        </FormDataConsumer>
        
        <TextInput source="phone" validate={required()} fullWidth />
        <TextInput source="address" fullWidth multiline rows={3} />
      </SimpleForm>
    </Edit>
  );
};

export default CustomerEdit; 