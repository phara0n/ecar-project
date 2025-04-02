import { Admin, Resource } from 'react-admin';
import { BrowserRouter } from 'react-router-dom';
import { dataProvider } from './api/dataProvider';
import { authProvider } from './api/authProvider';
import Dashboard from './pages/dashboard/Dashboard';
import { Layout } from './layouts/Layout';
import i18nProvider from './i18n';
import LoginPage from './pages/login/LoginPage';
import { useEffect } from 'react';

// Icons
import PeopleIcon from '@mui/icons-material/People';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ListAltIcon from '@mui/icons-material/ListAlt';
import NotificationsIcon from '@mui/icons-material/Notifications';

// Features
import { CustomerList, CustomerEdit, CustomerCreate } from './features/customers';
import { VehicleList, VehicleEdit, VehicleCreate } from './features/vehicles';
import { ServiceList, ServiceEdit, ServiceCreate } from './features/services';
import { ServiceItemList, ServiceItemEdit, ServiceItemCreate } from './features/service-items';
import { InvoiceList, InvoiceEdit, InvoiceCreate } from './features/invoices';
import { NotificationList, NotificationEdit, NotificationCreate } from './features/notifications';
import { 
  UserList, 
  UserEdit, 
  UserCreate, 
  SecurityLogList,
  RoleList,
  PermissionList
} from './features/admin';

function App() {
  // Initialize the language preference if it doesn't exist
  useEffect(() => {
    if (!localStorage.getItem('preferredLanguage')) {
      const browserLang = navigator.language.split('-')[0];
      localStorage.setItem('preferredLanguage', 
        ['en', 'fr'].includes(browserLang) ? browserLang : 'en'
      );
    }
  }, []);

  return (
    <BrowserRouter>
      <Admin 
        dataProvider={dataProvider} 
        authProvider={authProvider}
        dashboard={Dashboard}
        layout={Layout}
        loginPage={LoginPage}
        title="ECAR Garage Admin"
        i18nProvider={i18nProvider}
        disableTelemetry
        requireAuth
        defaultTheme="dark"
      >
        {/* Main Resources */}
        <Resource 
          name="customers" 
          list={CustomerList} 
          edit={CustomerEdit} 
          create={CustomerCreate} 
          icon={PeopleIcon}
          options={{ label: 'menu.customers' }}
        />
        <Resource 
          name="vehicles" 
          list={VehicleList} 
          edit={VehicleEdit} 
          create={VehicleCreate} 
          icon={DirectionsCarIcon}
          options={{ label: 'menu.vehicles' }}
        />
        <Resource 
          name="services" 
          list={ServiceList} 
          edit={ServiceEdit} 
          create={ServiceCreate} 
          icon={BuildIcon}
          options={{ label: 'menu.services' }}
        />
        <Resource 
          name="service-items" 
          list={ServiceItemList} 
          edit={ServiceItemEdit} 
          create={ServiceItemCreate} 
          icon={ListAltIcon}
          options={{ label: 'menu.serviceItems' }}
        />
        <Resource 
          name="invoices" 
          list={InvoiceList} 
          edit={InvoiceEdit} 
          create={InvoiceCreate} 
          icon={ReceiptIcon}
          options={{ label: 'menu.invoices' }}
        />
        <Resource 
          name="notifications" 
          list={NotificationList} 
          edit={NotificationEdit} 
          create={NotificationCreate} 
          icon={NotificationsIcon}
          options={{ label: 'menu.notifications' }}
        />
        
        {/* SuperAdmin Settings Panel */}
        <Resource 
          name="users" 
          list={UserList} 
          edit={UserEdit} 
          create={UserCreate} 
          icon={AdminPanelSettingsIcon}
          options={{ label: 'menu.users' }}
        />
        <Resource 
          name="roles" 
          list={RoleList} 
          icon={VpnKeyIcon}
          options={{ label: 'menu.roles' }}
        />
        <Resource 
          name="permissions" 
          list={PermissionList} 
          icon={SecurityIcon}
          options={{ label: 'menu.permissions' }}
        />
        <Resource 
          name="securitylogs" 
          list={SecurityLogList} 
          icon={HistoryIcon}
          options={{ label: 'menu.securityLogs' }}
        />
      </Admin>
    </BrowserRouter>
  );
}

export default App;
