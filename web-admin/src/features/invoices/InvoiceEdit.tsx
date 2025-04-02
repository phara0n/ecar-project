import React, { useState } from 'react';
import {
  Edit,
  SimpleForm,
  TextInput,
  ReferenceInput,
  SelectInput,
  DateInput,
  required,
  useTranslate,
  AutocompleteInput,
  NumberInput,
  SaveButton,
  DeleteButton,
  Toolbar,
  useNotify,
  useRedirect,
  FileInput,
  FileField,
  FormDataConsumer,
  useRecordContext,
  useGetOne
} from 'react-admin';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Divider,
  Chip,
  Button,
  Link,
  Paper
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HistoryIcon from '@mui/icons-material/History';
import EventIcon from '@mui/icons-material/Event';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';

const statusChoices = [
  { id: 'draft', name: 'Draft' },
  { id: 'pending', name: 'Pending' },
  { id: 'paid', name: 'Paid' },
  { id: 'refunded', name: 'Refunded' },
  { id: 'cancelled', name: 'Cancelled' },
];

// Custom toolbar with styled buttons
const CustomToolbar = (props: any) => (
  <Toolbar 
    {...props} 
    sx={{ 
      backgroundColor: 'primary.dark', 
      borderRadius: 1,
      justifyContent: 'space-between',
      marginTop: 2
    }}
  >
    <SaveButton />
    <DeleteButton />
  </Toolbar>
);

// Component to display the current total from service items
const InvoiceTotal = () => {
  const record = useRecordContext();
  if (!record || !record.id) return null;
  
  return (
    <Box sx={{ 
      mt: 2, 
      p: 2, 
      bgcolor: 'success.dark', 
      borderRadius: 1,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Typography variant="subtitle1" sx={{ color: 'white' }}>
        Total Amount
      </Typography>
      <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
        ${record.total?.toLocaleString() || '0.00'}
      </Typography>
    </Box>
  );
};

// Component to display PDF file information and links
const PDFViewer = () => {
  const record = useRecordContext();
  if (!record || !record.id) return null;
  
  // Get the PDF URL from the record
  const pdfUrl = record.pdf_file?.src || record.pdf_url;
  
  if (!pdfUrl) {
    return (
      <Box sx={{ 
        mt: 2, 
        p: 2,
        bgcolor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: 1,
        textAlign: 'center'
      }}>
        <PictureAsPdfIcon sx={{ color: 'text.secondary', fontSize: 40, opacity: 0.6 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          No PDF document attached to this invoice
        </Typography>
      </Box>
    );
  }
  
  return (
    <Paper elevation={1} sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <PictureAsPdfIcon sx={{ color: 'error.main', mr: 1 }} />
        <Typography variant="subtitle1">
          Invoice Document
        </Typography>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="small"
          startIcon={<VisibilityIcon />}
          component={Link}
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          View PDF
        </Button>
        
        <Button 
          variant="outlined" 
          color="primary" 
          size="small"
          startIcon={<DownloadIcon />}
          component={Link}
          href={pdfUrl}
          download="invoice.pdf"
        >
          Download PDF
        </Button>
      </Box>
    </Paper>
  );
};

const InvoiceEdit = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const redirect = useRedirect();
  
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
      refund_date: data.refund_date ? formatDate(data.refund_date) : undefined,
    };
  };
  
  const onSuccess = () => {
    notify('Invoice updated successfully');
    redirect('list', 'invoices');
  };
  
  return (
    <Edit 
      title="Edit Invoice" 
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
              Edit Invoice
            </Typography>
            <Divider />
          </Box>
          
          <SimpleForm 
            toolbar={<CustomToolbar />}
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
              {/* Invoice Details Section */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ReceiptIcon sx={{ mr: 1 }} />
                  Invoice Details
                </Typography>
                <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                  <TextInput 
                    source="id" 
                    disabled 
                    fullWidth 
                    sx={{ mb: 2 }}
                    helperText="Invoice ID (auto-generated)"
                  />
                  
                  <TextInput 
                    source="invoice_number" 
                    disabled 
                    fullWidth 
                    sx={{ mb: 2 }}
                    helperText="Invoice number (auto-generated)"
                  />
                  
                  <ReferenceInput source="service_id" reference="services">
                    <AutocompleteInput 
                      optionText={(record) => 
                        record ? `${record.title} - ${record.car?.make} ${record.car?.model} (${record.car?.license_plate})` : ''
                      }
                      validate={required()} 
                      fullWidth 
                      sx={{ mb: 2 }}
                      helperText="Service this invoice is for"
                      disabled
                    />
                  </ReferenceInput>
                  
                  <SelectInput 
                    source="status" 
                    choices={statusChoices} 
                    validate={required()} 
                    fullWidth 
                    sx={{ mb: 2 }}
                    helperText="Current status of the invoice"
                  />
                </Box>
              </Grid>
              
              {/* Dates and Files Section */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EventIcon sx={{ mr: 1 }} />
                  Dates and Documents
                </Typography>
                <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                  <DateInput 
                    source="issued_date" 
                    disabled
                    fullWidth 
                    sx={{ mb: 2 }}
                    helperText="Date the invoice was issued (auto-generated)"
                  />
                  
                  <DateInput 
                    source="due_date" 
                    validate={required()} 
                    fullWidth 
                    sx={{ mb: 2 }}
                    helperText="When is payment due? (Format: YYYY-MM-DD)"
                    format={formatDate}
                    parse={formatDate}
                  />
                  
                  {/* Show current PDF if available */}
                  <PDFViewer />
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Update Invoice Document
                    </Typography>
                    <FileInput 
                      source="pdf_file" 
                      label="Invoice PDF" 
                      accept="application/pdf,image/jpeg,image/png"
                      placeholder="Drop a new PDF file here, or click to select it"
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      <FileField source="src" title="title" />
                    </FileInput>
                  </Box>
                </Box>
              </Grid>
              
              {/* Notes Section */}
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
                    helperText="Any additional information or special instructions"
                  />
                  
                  <InvoiceTotal />
                </Box>
              </Grid>
              
              {/* Conditional Refund Section */}
              <FormDataConsumer>
                {({ formData }) => formData.status === 'refunded' && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <HistoryIcon sx={{ mr: 1 }} />
                      Refund Information
                    </Typography>
                    <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                      <DateInput 
                        source="refund_date" 
                        validate={formData.status === 'refunded' ? required() : undefined}
                        fullWidth 
                        sx={{ mb: 2 }}
                        helperText="Date the refund was processed (Format: YYYY-MM-DD)"
                        format={formatDate}
                        parse={formatDate}
                      />
                      
                      <NumberInput 
                        source="refund_amount" 
                        validate={formData.status === 'refunded' ? required() : undefined}
                        fullWidth 
                        sx={{ mb: 2 }}
                        helperText="Amount refunded to the customer"
                      />
                      
                      <TextInput 
                        source="refund_reason" 
                        multiline 
                        rows={3} 
                        fullWidth 
                        validate={formData.status === 'refunded' ? required() : undefined}
                        helperText="Reason for the refund"
                      />
                    </Box>
                  </Grid>
                )}
              </FormDataConsumer>
            </Grid>
          </SimpleForm>
        </CardContent>
      </Card>
    </Edit>
  );
};

export default InvoiceEdit; 