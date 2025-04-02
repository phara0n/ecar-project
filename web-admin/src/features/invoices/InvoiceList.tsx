import React, { useState } from 'react';
import {
  List,
  Datagrid,
  TextField,
  DateField,
  ReferenceField,
  NumberField,
  BooleanField,
  EditButton,
  DeleteButton,
  SearchInput,
  FilterList,
  FilterListItem,
  CreateButton,
  ExportButton,
  TopToolbar,
  useListContext,
  useTranslate,
  ReferenceInput,
  SelectInput,
  DateInput,
  UrlField
} from 'react-admin';
import {
  Box,
  Chip,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  Divider,
  Paper,
  useTheme,
  Badge,
  useMediaQuery,
  Button,
  Tooltip,
  IconButton
} from '@mui/material';
import PaidIcon from '@mui/icons-material/Paid';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ReceiptIcon from '@mui/icons-material/Receipt';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadDoneIcon from '@mui/icons-material/FileDownloadDone';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Invoice CSV export configuration
const exporter = (data: any) => {
  const csvData = data.map((record: any) => ({
    id: record.id,
    invoice_number: record.invoice_number,
    service: record.service_id,
    issued_date: record.issued_date,
    due_date: record.due_date,
    status: record.status,
    total: record.total,
    paid: record.status === 'paid' ? 'Yes' : 'No',
  }));

  const fields = [
    'id',
    'invoice_number',
    'service',
    'issued_date',
    'due_date',
    'status',
    'total',
    'paid',
  ];

  return {
    data: csvData,
    fields,
  };
};

// Filter options
const invoiceFilters = [
  <SearchInput source="q" alwaysOn />,
  <ReferenceInput source="service_id" reference="services">
    <SelectInput
      optionText={(record) =>
        record ? `${record.title} - ${record.car?.make} ${record.car?.model}` : ''
      }
    />
  </ReferenceInput>,
  <SelectInput
    source="status"
    choices={[
      { id: 'draft', name: 'Draft' },
      { id: 'pending', name: 'Pending' },
      { id: 'paid', name: 'Paid' },
      { id: 'refunded', name: 'Refunded' },
      { id: 'cancelled', name: 'Cancelled' },
    ]}
  />,
  <DateInput source="issued_date_gte" label="Issued after" />,
  <DateInput source="issued_date_lte" label="Issued before" />,
  <DateInput source="due_date_gte" label="Due after" />,
  <DateInput source="due_date_lte" label="Due before" />,
];

// List actions component
const ListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

// Status chip styling helper
const getStatusProps = (status: string) => {
  switch (status) {
    case 'draft':
      return {
        icon: <ScheduleIcon />,
        color: 'default' as const,
        label: 'Draft'
      };
    case 'pending':
      return {
        icon: <WarningIcon />,
        color: 'warning' as const,
        label: 'Pending'
      };
    case 'paid':
      return {
        icon: <CheckCircleIcon />,
        color: 'success' as const,
        label: 'Paid'
      };
    case 'refunded':
      return {
        icon: <RefreshIcon />,
        color: 'secondary' as const,
        label: 'Refunded'
      };
    case 'cancelled':
      return {
        icon: <CancelIcon />,
        color: 'error' as const,
        label: 'Cancelled'
      };
    default:
      return {
        icon: <WarningIcon />,
        color: 'default' as const,
        label: status
      };
  }
};

// PDF Link component for the datagrid
const PDFLink = ({ record }) => {
  if (!record || !record.pdf_file) return null;
  
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Tooltip title="View PDF">
        <IconButton 
          color="primary" 
          component="a" 
          href={record.pdf_file} 
          target="_blank"
          rel="noopener noreferrer"
          size="small"
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Download PDF">
        <IconButton 
          color="secondary" 
          component="a" 
          href={record.pdf_file} 
          download={`invoice-${record.invoice_number}.pdf`}
          size="small"
        >
          <FileDownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

// Grid layout for invoices
const InvoiceGrid = () => {
  const { data, isLoading } = useListContext();
  if (isLoading || !data) return null;
  
  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {data.map(invoice => {
        const statusProps = getStatusProps(invoice.status);
        const isPastDue = new Date(invoice.due_date) < new Date() && invoice.status === 'pending';
        
        return (
          <Grid item xs={12} sm={6} md={4} key={invoice.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderLeft: invoice.status === 'paid' ? '4px solid #4caf50' : 
                           isPastDue ? '4px solid #f44336' : 
                           '4px solid #2196f3',
                '&:hover': {
                  boxShadow: 3,
                  transform: 'translateY(-4px)',
                  transition: 'all 0.3s'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                    <ReceiptIcon sx={{ mr: 1, color: 'primary.main' }} />
                    {invoice.invoice_number}
                  </Typography>
                  <Chip 
                    icon={statusProps.icon}
                    label={statusProps.label}
                    color={statusProps.color}
                    size="small"
                  />
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Service:</strong> {invoice.service?.title || 'N/A'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Vehicle:</strong> {invoice.service?.car?.make} {invoice.service?.car?.model}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Issued:</strong> {new Date(invoice.issued_date).toLocaleDateString()}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color={isPastDue ? "error.main" : "text.secondary"}
                    sx={{ fontWeight: isPastDue ? 'bold' : 'normal' }}
                  >
                    <strong>Due:</strong> {new Date(invoice.due_date).toLocaleDateString()}
                  </Typography>
                </Box>
                
                <Paper
                  elevation={2}
                  sx={{
                    mt: 2,
                    p: 1,
                    bgcolor: 'background.default',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Typography variant="subtitle2">Total Amount:</Typography>
                  <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                    ${invoice.total?.toLocaleString() || '0.00'}
                  </Typography>
                </Paper>
                
                {invoice.status === 'refunded' && (
                  <Paper
                    elevation={2}
                    sx={{
                      mt: 2,
                      p: 1,
                      bgcolor: 'secondary.light',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="subtitle2">Refunded:</Typography>
                    <Typography variant="h6" color="secondary.main" sx={{ fontWeight: 'bold' }}>
                      ${invoice.refund_amount?.toLocaleString() || '0.00'}
                    </Typography>
                  </Paper>
                )}
                
                {invoice.pdf_file && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      component="a"
                      href={invoice.pdf_file}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<FileDownloadIcon />}
                      component="a"
                      href={invoice.pdf_file}
                      download={`invoice-${invoice.invoice_number}.pdf`}
                    >
                      Download
                    </Button>
                  </Box>
                )}
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 0 }}>
                <EditButton sx={{ marginLeft: 'auto' }} />
                <DeleteButton />
              </CardActions>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

// Main list component
const InvoiceList = () => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  const translate = useTranslate();
  
  return (
    <List
      actions={<ListActions />}
      filters={invoiceFilters}
      exporter={exporter}
      title={translate('resources.invoices.list.title')}
      sx={{
        '& .RaList-main': { margin: 0 },
        '& .RaList-content': { boxShadow: 'none' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'start' }}>
        <Box sx={{ flex: 1, mr: 2 }}>
          {isSmall ? (
            <InvoiceGrid />
          ) : (
            <Datagrid bulkActionButtons={false} sx={{ '& .RaDatagrid-headerCell': { fontWeight: 'bold' } }}>
              <TextField source="id" />
              <TextField source="invoice_number" />
              <ReferenceField source="service_id" reference="services">
                <TextField source="title" />
              </ReferenceField>
              <NumberField
                source="total"
                options={{ style: 'currency', currency: 'USD' }}
              />
              <DateField source="issued_date" />
              <DateField source="due_date" />
              <TextField
                source="status"
                render={(record) => {
                  if (!record) return null;
                  const statusProps = getStatusProps(record.status);
                  return (
                    <Chip
                      icon={statusProps.icon}
                      label={statusProps.label}
                      color={statusProps.color}
                      size="small"
                    />
                  );
                }}
              />
              <PDFLink label="PDF" />
              <EditButton />
              <DeleteButton />
            </Datagrid>
          )}
        </Box>
        
        <Box
          component="aside"
          sx={{
            width: 200,
            display: { xs: 'none', md: 'block' },
            marginTop: '13px', // Align with the top of the Datagrid
          }}
        >
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status
              </Typography>
              <FilterList
                label="Status"
                icon={<PaidIcon />}
              >
                <FilterListItem
                  label="Draft"
                  value={{ status: 'draft' }}
                />
                <FilterListItem
                  label="Pending"
                  value={{ status: 'pending' }}
                />
                <FilterListItem
                  label="Paid"
                  value={{ status: 'paid' }}
                />
                <FilterListItem
                  label="Refunded"
                  value={{ status: 'refunded' }}
                />
                <FilterListItem
                  label="Cancelled"
                  value={{ status: 'cancelled' }}
                />
              </FilterList>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </List>
  );
};

export default InvoiceList; 