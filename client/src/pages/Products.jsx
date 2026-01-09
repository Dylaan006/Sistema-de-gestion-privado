import { useState, useEffect } from 'react';
import { Table, Button, Group, Title, Modal, TextInput, NumberInput, ActionIcon, Badge, Select, Textarea, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { IconTrash, IconAdjustments, IconArrowsExchange } from '@tabler/icons-react';
import api from '../api/axios';
import { notifications } from '@mantine/notifications';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [opened, { open, close }] = useDisclosure(false);
    const [adjustmentOpened, { open: openAdjustment, close: closeAdjustment }] = useDisclosure(false);

    // Delete Confirmation State
    const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
    const [productToDelete, setProductToDelete] = useState(null);

    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form for New/Edit Product
    const form = useForm({
        initialValues: {
            name: '',
            barcode: '',
            price: 0,
            cost: 0,
            stock: 0,
        },
        validate: {
            name: (val) => (val.length < 2 ? 'Nombre muy corto' : null),
            price: (val) => (val < 0 ? 'Precio inválido' : null),
        },
    });

    // Form for Stock Adjustment
    const adjustForm = useForm({
        initialValues: {
            productId: '',
            type: 'IN',
            quantity: 1,
            reason: ''
        },
        validate: {
            productId: (val) => (!val ? 'Seleccione producto' : null),
            quantity: (val) => (val < 1 ? 'Cantidad positiva requerida' : null),
            reason: (val) => (val.length < 3 ? 'Motivo requerido' : null)
        }
    });

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            if (editingId) {
                const payload = { ...values };
                delete payload.stock;
                await api.put(`/products/${editingId}`, payload);
                notifications.show({ title: 'Éxito', message: 'Producto actualizado', color: 'green' });
            } else {
                await api.post('/products', values);
                notifications.show({ title: 'Éxito', message: 'Producto creado', color: 'green' });
            }
            fetchProducts();
            close();
            form.reset();
            setEditingId(null);
        } catch (error) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || 'Error al guardar', color: 'red' });
        }
        setLoading(false);
    };

    const handleAdjustmentSubmit = async (values) => {
        setLoading(true);
        try {
            await api.post('/stock/adjust', {
                ...values,
                productId: Number(values.productId) // Ensure number
            });
            notifications.show({ title: 'Stock Ajustado', message: 'Movimiento registrado', color: 'green' });
            fetchProducts();
            closeAdjustment();
            adjustForm.reset();
        } catch (error) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || 'Error al ajustar', color: 'red' });
        }
        setLoading(false);
    };

    const handleEdit = (product) => {
        setEditingId(product.id);
        form.setValues({
            name: product.name,
            barcode: product.barcode || '',
            price: Number(product.price),
            cost: Number(product.cost),
            stock: product.stock
        });
        open();
    };

    const confirmDelete = (product) => {
        setProductToDelete(product);
        openDeleteModal();
    };

    const handleDelete = async () => {
        if (!productToDelete) return;
        setLoading(true);
        try {
            await api.delete(`/products/${productToDelete.id}`);
            notifications.show({ message: 'Producto eliminado', color: 'green' });
            fetchProducts();
            closeDeleteModal();
            setProductToDelete(null);
        } catch (error) {
            notifications.show({ title: 'Error', message: error.response?.data?.error || 'Error al eliminar', color: 'red' });
        }
        setLoading(false);
    };

    const rows = products.map((product) => (
        <Table.Tr key={product.id}>
            <Table.Td>{product.name}</Table.Td>
            <Table.Td><Badge variant="outline">{product.barcode || '-'}</Badge></Table.Td>
            <Table.Td>${Number(product.price).toFixed(2)}</Table.Td>
            <Table.Td>${Number(product.cost).toFixed(2)}</Table.Td>
            <Table.Td>
                <Badge color={product.stock <= product.minStock ? 'red' : 'green'}>{product.stock}</Badge>
            </Table.Td>
            <Table.Td>
                <Group gap={0}>
                    <ActionIcon variant="subtle" color="gray" onClick={() => handleEdit(product)}>
                        <IconAdjustments size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => confirmDelete(product)}>
                        <IconTrash size={16} />
                    </ActionIcon>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    const productOptions = products.map(p => ({ value: String(p.id), label: `${p.name} (Stock: ${p.stock})` }));

    return (
        <>
            <Group justify="space-between" mb="lg">
                <Title order={2}>Inventario</Title>
                <Group>
                    <Button variant="light" leftSection={<IconArrowsExchange size={16} />} onClick={openAdjustment}>
                        Ajustar Stock
                    </Button>
                    <Button onClick={() => { setEditingId(null); form.reset(); open(); }}>+ Nuevo Producto</Button>
                </Group>
            </Group>

            <Table>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Nombre</Table.Th>
                        <Table.Th>Código</Table.Th>
                        <Table.Th>Precio</Table.Th>
                        <Table.Th>Costo</Table.Th>
                        <Table.Th>Stock</Table.Th>
                        <Table.Th>Acciones</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>

            {/* Modal Producto */}
            <Modal opened={opened} onClose={close} title={editingId ? "Editar Producto" : "Nuevo Producto"}>
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput label="Nombre" mb="sm" required {...form.getInputProps('name')} />
                    <TextInput label="Código Barras" mb="sm" {...form.getInputProps('barcode')} />
                    <Group grow mb="sm">
                        <NumberInput label="Precio Venta" prefix="$" required {...form.getInputProps('price')} />
                        <NumberInput label="Costo" prefix="$" {...form.getInputProps('cost')} />
                    </Group>
                    {!editingId && (
                        <NumberInput label="Stock Inicial" mb="lg" {...form.getInputProps('stock')} />
                    )}
                    {editingId && (
                        <TextInput label="Stock" disabled value={form.values.stock} mb="lg" description="El stock se ajusta desde 'Ajustar Stock'" />
                    )}
                    <Button type="submit" fullWidth loading={loading}>Guardar Producto</Button>
                </form>
            </Modal>

            {/* Modal Ajuste Stock */}
            <Modal opened={adjustmentOpened} onClose={closeAdjustment} title="Ajuste de Stock">
                <form onSubmit={adjustForm.onSubmit(handleAdjustmentSubmit)}>
                    <Select
                        label="Producto"
                        placeholder="Buscar producto..."
                        data={productOptions}
                        searchable
                        mb="sm"
                        {...adjustForm.getInputProps('productId')}
                    />
                    <Select
                        label="Tipo de Movimiento"
                        data={[
                            { value: 'IN', label: '📥 Entrada (Compra/Devolución)' },
                            { value: 'OUT', label: '📤 Salida (Pérdida/Regalo/Uso)' }
                        ]}
                        mb="sm"
                        {...adjustForm.getInputProps('type')}
                    />
                    <NumberInput label="Cantidad" min={1} mb="sm" {...adjustForm.getInputProps('quantity')} />
                    <Textarea label="Motivo / Nota" placeholder="Ej: Rotura en depósito" required mb="lg" {...adjustForm.getInputProps('reason')} />

                    <Button type="submit" fullWidth color={adjustForm.values.type === 'OUT' ? 'red' : 'blue'} loading={loading}>
                        Confirmar Movimiento
                    </Button>
                </form>
            </Modal>

            {/* Modal Confirmación Borrar */}
            <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="Confirmar Eliminación" centered>
                <Text size="sm" mb="lg">
                    ¿Estás seguro que deseas eliminar el producto <b>{productToDelete?.name}</b>?
                    Esta acción no se puede deshacer.
                </Text>
                <Group position="right">
                    <Button variant="default" onClick={closeDeleteModal}>Cancelar</Button>
                    <Button color="red" onClick={handleDelete} loading={loading}>Eliminar</Button>
                </Group>
            </Modal>
        </>
    );
}
