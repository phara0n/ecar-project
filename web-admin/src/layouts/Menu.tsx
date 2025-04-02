import { Menu as RaMenu, MenuProps, useTranslate } from 'react-admin';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssessmentIcon from '@mui/icons-material/Assessment';

export const Menu = (props: MenuProps) => {
  const translate = useTranslate();

  return (
    <RaMenu {...props}>
      <RaMenu.DashboardItem
        primaryText={translate('menu.dashboard')}
        leftIcon={<DashboardIcon />}
      />
      <RaMenu.Item
        to="/customers"
        primaryText={translate('menu.customers')}
        leftIcon={<PeopleIcon />}
      />
      <RaMenu.Item
        to="/vehicles"
        primaryText={translate('menu.vehicles')}
        leftIcon={<DirectionsCarIcon />}
      />
      <RaMenu.Item
        to="/services"
        primaryText={translate('menu.services')}
        leftIcon={<BuildIcon />}
      />
      <RaMenu.Item
        to="/invoices"
        primaryText={translate('menu.invoices')}
        leftIcon={<ReceiptIcon />}
      />
      <RaMenu.Item
        to="/reports"
        primaryText={translate('menu.reports')}
        leftIcon={<AssessmentIcon />}
      />
    </RaMenu>
  );
}; 