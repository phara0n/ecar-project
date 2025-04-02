import {
  List,
  Datagrid,
  TextField,
  ReferenceField,
  DateField,
  NumberField,
  BooleanField,
  SearchInput,
  EditButton,
  useTranslate,
  downloadCSV,
  ExportButton,
  TopToolbar,
  Button,
} from 'react-admin';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsonExport from 'jsonexport/dist';

const exporter = (invoices: any) => {
  const invoicesForExport = invoices.map((invoice: any) => {
    const { id, invoice_number, amount, issued_date, due_date, paid, ...exportedInvoice } = invoice;
    exportedInvoice.id = id;
    exportedInvoice.invoice_number = invoice_number;
    exportedInvoice.amount = amount;
    exportedInvoice.issued_date = issued_date;
    exportedInvoice.due_date = due_date;
    exportedInvoice.paid = paid ? 'Yes' : 'No';
    
    return exportedInvoice;
  });
  
  jsonExport(invoicesForExport, {
    headers: ['id', 'invoice_number', 'amount', 'issued_date', 'due_date', 'paid', 'payment_date'],
  }, (err, csv) => {
    downloadCSV(csv, 'invoices');
  });
};

const InvoiceListActions = ({ className }: { className?: string }) => (
  <TopToolbar className={className}>
    <ExportButton />
    <Button
      label="Generate PDF"
      startIcon={<PictureAsPdfIcon />}
      onClick={() => alert('PDF generation will be implemented')}
    />
  </TopToolbar>
);

const invoiceFilters = [
  <SearchInput source="q" alwaysOn />,
];

const InvoiceList = () => {
  const translate = useTranslate();
  
  return (
    <List 
      filters={invoiceFilters}
      actions={<InvoiceListActions />}
      exporter={exporter}
    >
      <Datagrid>
        <TextField source="id" />
        <TextField source="invoice_number" />
        <ReferenceField source="service_id" reference="services">
          <TextField source="name" />
        </ReferenceField>
        <ReferenceField source="customer_id" reference="customers">
          <TextField source="name" />
        </ReferenceField>
        <NumberField source="amount" options={{ style: 'currency', currency: 'USD' }} />
        <DateField source="issued_date" />
        <DateField source="due_date" />
        <BooleanField source="paid" />
        <DateField source="payment_date" />
        <EditButton />
      </Datagrid>
    </List>
  );
};

export default InvoiceList; 