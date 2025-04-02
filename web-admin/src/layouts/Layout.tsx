import { Layout as RaLayout, LayoutProps } from 'react-admin';
import { AppBar } from './AppBar';
import { Menu } from './Menu';

export const Layout = (props: LayoutProps) => {
  return (
    <RaLayout
      {...props}
      appBar={AppBar}
      menu={Menu}
    />
  );
}; 