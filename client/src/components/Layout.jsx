import { AppShell, Burger, Group, NavLink, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconHome,
    IconBox,
    IconCash,
    IconLogout,
    IconBuildingStore,
    IconHistory,
    IconUsers,
    IconArrowsExchange,
    IconUserCog
} from '@tabler/icons-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
    const [opened, { toggle }] = useDisclosure();
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();

    const links = [
        { label: 'Dashboard', icon: IconHome, to: '/' },
        { label: 'Punto de Venta', icon: IconCash, to: '/pos' },
        { label: 'Inventario', icon: IconBox, to: '/products' },
        { label: 'Movimientos Stock', icon: IconArrowsExchange, to: '/stock-history' },
        { label: 'Ventas', icon: IconHistory, to: '/sales' },
        { label: 'Clientes', icon: IconUsers, to: '/clients' },
        { label: 'Usuarios', icon: IconUserCog, to: '/users' },
        { label: 'Mi Empresa', icon: IconBuildingStore, to: '/settings' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md">
                    <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                    <Title order={3}>Sistema de Gestión</Title>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        label={link.label}
                        leftSection={<link.icon size="1rem" stroke={1.5} />}
                        active={location.pathname === link.to}
                        onClick={() => {
                            navigate(link.to);
                            if (opened) toggle();
                        }}
                    />
                ))}

                <NavLink
                    label="Cerrar Sesión"
                    leftSection={<IconLogout size="1rem" stroke={1.5} />}
                    onClick={handleLogout}
                    color="red"
                    variant="filled"
                    mt="auto"
                />
                <Title order={6} mt="sm">{user?.name}</Title>
            </AppShell.Navbar>

            <AppShell.Main>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
}
