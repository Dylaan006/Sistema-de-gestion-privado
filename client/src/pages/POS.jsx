import { useState, useRef, useEffect } from 'react';
import { Title, Grid, Paper, TextInput, Button, Table, Group, ActionIcon, NumberInput, Select, Switch, Text, Modal, SegmentedControl, Autocomplete, Badge, Divider } from '@mantine/core';
import { IconSearch, IconTrash, IconShoppingCart, IconUser, IconReceipt, IconEdit } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import api from '../api/axios';

export default function POS() {
    const [query, setQuery] = useState('');
    const [cart, setCart] = useState([]);
    const searchInputRef = useRef(null);

    // POS Settings
    const [invoiceType, setInvoiceType] = useState('X');
    const [clientData, setClientData] = useState({ id: null, name: 'Consumidor Final', cuit: '' });
    const [headerOpen, { open: openHeader, close: closeHeader }] = useDisclosure(false);
    const [loading, setLoading] = useState(false);

    // Search and Add Logic
    const handleSearch = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!query.trim()) return;

            try {
                // Search product in backend
                const res = await api.get(`/products?search=${query}`);
                const products = res.data;

                if (products.length === 1) {
                    addToCart(products[0]);
                    setQuery('');
                } else if (products.length === 0) {
                    notifications.show({ message: 'Producto no encontrado', color: 'red' });
                } else {
                    notifications.show({ message: 'Múltiples resultados (falta implementar selector)', color: 'orange' });
                    addToCart(products[0]);
                    setQuery('');
                }
            } catch (error) {
                console.error(error);
            }
        }
    };

    const addToCart = (product) => {
        setCart((prev) => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const total = cart.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        // Basic Validation
        if (invoiceType === 'A' && !clientData.cuit) {
            notifications.show({ message: 'Para Factura A se requiere CUIT', color: 'red' });
            openHeader();
            return;
        }

        setLoading(true);
        try {
            const saleData = {
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity
                })),
                invoiceType,
                clientCuit: invoiceType === 'A' ? clientData.cuit : undefined,
                clientName: invoiceType === 'A' ? clientData.name : undefined,
                clientId: clientData.id || undefined
            };

            await api.post('/sales', saleData);

            notifications.show({
                title: 'Venta Exitosa',
                message: invoiceType !== 'X' ? 'Factura Fiscal generada correctamente' : 'Venta interna registrada',
                color: 'green'
            });

            setCart([]);
            // Reset to default client but keep invoice type choice? Usually reset to Consumer Final X is safer.
            setClientData({ id: null, name: 'Consumidor Final', cuit: '' });
            setInvoiceType('X');
            searchInputRef.current?.focus();
        } catch (error) {
            console.error(error);
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || 'Error al procesar la venta',
                color: 'red'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClientSelect = (val) => {
        // Mock logic for now, ideally search client API
        // If string, assume manual entry or search result
        // For simpler UX, let's allow manual input of CUIT for Fac A in the modal
        if (!val) return;
        setClientData(prev => ({ ...prev, name: val }));
    };

    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    const rows = cart.map((item) => (
        <Table.Tr key={item.id}>
            <Table.Td>{item.name}</Table.Td>
            <Table.Td>${Number(item.price)}</Table.Td>
            <Table.Td>{item.quantity}</Table.Td>
            <Table.Td>${Number(item.price) * item.quantity}</Table.Td>
            <Table.Td>
                <ActionIcon color="red" variant="subtle" onClick={() => removeFromCart(item.id)}>
                    <IconTrash size={16} />
                </ActionIcon>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Grid>
            <Grid.Col span={8}>
                <Title order={2} mb="md">Punto de Venta</Title>
                <TextInput
                    placeholder="Escanear Código o Buscar..."
                    leftSection={<IconSearch size={16} />}
                    size="xl"
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    onKeyDown={handleSearch}
                    ref={searchInputRef}
                    mb="md"
                />

                {/* Future: Product Grid here could be visual selector */}
                <Paper p="md" withBorder>
                    <Text c="dimmed" ta="center">Escanea un producto o búscalo por nombre para agregarlo.</Text>
                </Paper>
            </Grid.Col>

            <Grid.Col span={4}>
                <Paper shadow="sm" p="0" radius="md" withBorder h="85vh" style={{ display: 'flex', flexDirection: 'column' }}>

                    {/* TICKET HEADER */}
                    <Paper p="md" bg="blue.0" style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={openHeader}>
                        <Group justify="space-between" mb={5}>
                            <Group gap="xs">
                                <IconReceipt size={20} color="#228be6" />
                                <Text fw={700} c="blue.8">
                                    {invoiceType === 'X' ? 'Nota de Venta' : `Factura ${invoiceType}`}
                                </Text>
                            </Group>
                            <ActionIcon variant="transparent" size="sm">
                                <IconEdit size={16} />
                            </ActionIcon>
                        </Group>
                        <Group gap="xs">
                            <IconUser size={16} color="gray" />
                            <Text size="sm" c="dimmed">{clientData.name} {clientData.cuit ? `(${clientData.cuit})` : ''}</Text>
                        </Group>
                    </Paper>

                    {/* CART ITEMS */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <Table striped verticalSpacing="xs">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Prod</Table.Th>
                                    <Table.Th>$$</Table.Th>
                                    <Table.Th>Cant</Table.Th>
                                    <Table.Th>Sub</Table.Th>
                                    <Table.Th></Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{rows}</Table.Tbody>
                        </Table>
                    </div>

                    {/* FOOTER ACTIONS */}
                    <div style={{ marginTop: 'auto', padding: 20, borderTop: '1px solid #eee', backgroundColor: '#fff' }}>
                        <Group justify="space-between" mb="lg">
                            <Text size="xl" fw={700}>TOTAL:</Text>
                            <Text size="xl" fw={700} c="blue">${total.toFixed(2)}</Text>
                        </Group>

                        <Button fullWidth size="xl" onClick={handleCheckout} disabled={cart.length === 0} loading={loading}>
                            COBRAR
                        </Button>
                    </div>
                </Paper>
            </Grid.Col>

            {/* HEADER SETTINGS MODAL */}
            <Modal opened={headerOpen} onClose={closeHeader} title="Datos del Comprobante" centered>
                <Text size="sm" fw={500} mb="xs">Tipo de Comprobante</Text>
                <SegmentedControl
                    value={invoiceType}
                    onChange={setInvoiceType}
                    fullWidth
                    data={[
                        { label: 'Nota X (Interna)', value: 'X' },
                        { label: 'Factura B', value: 'B' },
                        { label: 'Factura A', value: 'A' }
                    ]}
                    mb="lg"
                />

                <Divider my="sm" />

                <Text size="sm" fw={500} mb="xs">Cliente</Text>

                {invoiceType === 'X' && <Text size="sm" c="dimmed" mb="md">Para ventas internas no es obligatorio identificar al cliente.</Text>}
                {invoiceType === 'B' && <Text size="sm" c="dimmed" mb="md">Consumidor final por defecto. Ingrese datos si supera el monto límite.</Text>}

                <TextInput
                    label="Nombre / Razón Social"
                    placeholder="Consumidor Final"
                    value={clientData.name}
                    onChange={(e) => setClientData({ ...clientData, name: e.currentTarget.value })}
                    mb="sm"
                />

                <Group grow align="flex-end" mb="lg">
                    <TextInput
                        label="CUIT Cliente"
                        placeholder="20-12345678-9"
                        value={clientData.cuit}
                        onChange={(e) => setClientData({ ...clientData, cuit: e.target.value })}
                    />
                    <Button
                        variant="light"
                        color="blue"
                        onClick={async () => {
                            if (!clientData.cuit) return;
                            try {
                                notifications.show({ id: 'check-cuit', loading: true, message: 'Consultando AFIP...', autoClose: false, withCloseButton: false });
                                const res = await api.get(`/afip/check-cuit/${clientData.cuit}`);
                                const { nombre, condicionIVA } = res.data;

                                setClientData(prev => ({ ...prev, name: nombre }));
                                notifications.update({ id: 'check-cuit', message: `Cliente encontrado: ${nombre}`, color: 'green', loading: false, autoClose: 3000 });
                            } catch (err) {
                                console.error(err);
                                notifications.update({ id: 'check-cuit', message: 'No encontrado o Error de AFIP', color: 'red', loading: false, autoClose: 3000 });
                            }
                        }}
                    >
                        Buscar
                    </Button>
                </Group>

                <Button fullWidth onClick={closeHeader}>Confirmar Datos</Button>
            </Modal>
        </Grid>
    );
}
