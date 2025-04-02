import { Admin, Resource } from 'react-admin';
import { BrowserRouter } from 'react-router-dom';
import { dataProvider } from './api/dataProvider';
import { authProvider } from './api/authProvider';
import Dashboard from './pages/dashboard/Dashboard';
import { Layout } from './layouts/Layout';
import i18nProvider from './i18n';

// Icons
import PeopleIcon from '@mui/icons-material/People';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';
import ReceiptIcon from '@mui/icons-material/Receipt';

// Features
import { CustomerList, CustomerEdit, CustomerCreate } from './features/customers';
import { VehicleList, VehicleEdit, VehicleCreate } from './features/vehicles';
import { ServiceList, ServiceEdit, ServiceCreate } from './features/services';
import { InvoiceList, InvoiceEdit, InvoiceCreate } from './features/invoices';

function App() {
  return (
    <BrowserRouter>
      <Admin 
        dataProvider={dataProvider} 
        authProvider={authProvider}
        dashboard={Dashboard}
        layout={Layout}
        title="ECAR Garage Admin"
        i18nProvider={i18nProvider}
        disableTelemetry
        requireAuth
      >
        <Resource 
          name="customers" 
          list={CustomerList} 
          edit={CustomerEdit} 
          create={CustomerCreate} 
          icon={PeopleIcon}
        />
        <Resource 
          name="vehicles" 
          list={VehicleList} 
          edit={VehicleEdit} 
          create={VehicleCreate} 
          icon={DirectionsCarIcon}
        />
        <Resource 
          name="services" 
          list={ServiceList} 
          edit={ServiceEdit} 
          create={ServiceCreate} 
          icon={BuildIcon}
        />
        <Resource 
          name="invoices" 
          list={InvoiceList} 
          edit={InvoiceEdit} 
          create={InvoiceCreate} 
          icon={ReceiptIcon}
        />
      </Admin>
    </BrowserRouter>
  );
}

export default App;
