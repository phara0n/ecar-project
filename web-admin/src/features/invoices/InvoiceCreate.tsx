import React from 'react';
import {
  Create,
  SimpleForm,
  TextInput,
  ReferenceInput,
  SelectInput,
  DateInput,
  required,
  useTranslate,
  AutocompleteInput,
  SaveButton,
  Toolbar,
  useNotify,
  useRedirect,
  FileInput,
  FileField
} from 'react-admin';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Divider
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventIcon from '@mui/icons-material/Event';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const statusChoices = [
  { id: 'draft', name: 'Draft' },
  { id: 'pending', name: 'Pending' },
  { id: 'paid', name: 'Paid' },
  { id: 'cancelled', name: 'Cancelled' },
];

// Custom toolbar with styled save button
const CustomToolbar = (props: any) => (
  <Toolbar 
    {...props} 
    sx={{ 
      backgroundColor: 'primary.dark', 
      borderRadius: 1,
      marginTop: 2
    }}
  >
    <SaveButton label="Create Invoice" />
  </Toolbar>
);

const InvoiceCreate = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const redirect = useRedirect();
  
  // Calculate a default due date 15 days from today in YYYY-MM-DD format
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 15);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  // Format date to YYYY-MM-DD
  const formatDate = (date) => {
    if (!date) return null;
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0];
  };

  // Transform form values before submission
  const transform = (data) => {
    return {
      ...data,
      due_date: formatDate(data.due_date),
    };
  };

  const onSuccess = () => {
    notify('Invoice created successfully');
    redirect('list', 'invoices');
  };

  const defaultValues = {
    status: 'draft',
    due_date: getDefaultDueDate(),
  };
  
  // Simply pass through the file object directly
  const parseFileUpload = files => files;
  
  return (
    <Create 
      title="Create Invoice" 
      redirect="list"
      mutationOptions={{ onSuccess }}
      transform={transform}
    >
      <Card sx={{ 
        bgcolor: 'background.paper',
        boxShadow: 3,
        borderRadius: 2,
        p: 0,
      }}>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              New Invoice
            </Typography>
            <Divider />
          </Box>

          <SimpleForm 
            toolbar={<CustomToolbar />}
            defaultValues={defaultValues}
            sx={{ 
              '& .RaSimpleFormIterator-form': {
                bgcolor: 'background.paper',
                p: 2,
                borderRadius: 1,
                mt: 2,
              }
            }}
          >
            <Grid container spacing={2}>
              {/* Basic Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ReceiptIcon sx={{ mr: 1 }} />
                  Invoice Details
                </Typography>
                <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                  <ReferenceInput source="service_id" reference="services">
                    <AutocompleteInput 
                      optionText={(record) => 
                        record ? `${record.title} - ${record.car?.make} ${record.car?.model} (${record.car?.license_plate})` : ''
                      }
                      validate={required()} 
                      fullWidth 
                      label="Service"
                      helperText="Select the service this invoice is for"
                      sx={{ mb: 2 }}
                    />
                  </ReferenceInput>
                  
                  <SelectInput 
                    source="status" 
                    choices={statusChoices} 
                    defaultValue="draft"
                    validate={required()} 
                    fullWidth 
                    label="Status"
                    helperText="Current status of the invoice"
                    sx={{ mb: 2 }}
                  />
                </Box>
              </Grid>
              
              {/* Date and File */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EventIcon sx={{ mr: 1 }} />
                  Dates and Documents
                </Typography>
                <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                  <DateInput 
                    source="due_date" 
                    defaultValue={getDefaultDueDate()}
                    validate={required()} 
                    fullWidth 
                    label="Due Date"
                    helperText="When is payment due? (Format: YYYY-MM-DD)"
                    sx={{ mb: 2 }}
                    format={formatDate}
                    parse={formatDate}
                  />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2, 
                    p: 2, 
                    bgcolor: 'rgba(0, 0, 0, 0.05)', 
                    borderRadius: 1,
                    border: '1px dashed rgba(0, 0, 0, 0.2)'
                  }}>
                    <PictureAsPdfIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Upload an invoice document (PDF, JPG, or PNG format). File size limit: 5MB.
                    </Typography>
                  </Box>
                  
                  <FileInput 
                    source="pdf_file" 
                    label="Invoice PDF" 
                    accept="application/pdf,image/jpeg,image/png"
                    placeholder="Drop a PDF file here, or click to select it"
                    fullWidth
                    sx={{ mb: 2 }}
                    validate={required("Invoice PDF is required")}
                    maxSize={5000000} // 5MB limit
                    multiple={false}
                    parse={parseFileUpload}
                  >
                    <FileField source="src" title="title" />
                  </FileInput>
                </Box>
              </Grid>
              
              {/* Notes */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DescriptionIcon sx={{ mr: 1 }} />
                  Additional Information
                </Typography>
                <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                  <TextInput 
                    source="notes" 
                    multiline 
                    rows={3} 
                    fullWidth 
                    label="Notes"
                    helperText="Any additional information or special instructions"
                  />
                </Box>
              </Grid>
            </Grid>
          </SimpleForm>
        </CardContent>
      </Card>
    </Create>
  );
};

export default InvoiceCreate; 