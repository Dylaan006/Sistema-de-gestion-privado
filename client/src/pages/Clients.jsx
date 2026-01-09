import { useState, useEffect } from 'react';
import { Title, Grid, Paper, TextInput, Button, Table, Group, ActionIcon, Modal, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconTrash, IconEdit, IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import api from '../api/axios';

export default function Clients() {
    const [clients, setClients] = useState([]);
    const [opened, setOpened] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const form = useForm({
        initialValues: {
            name: '',
            cuit: '',
            email: '',
            address: '',
            taxCondition: 'CONSUMIDOR_FINAL'
        },
        validate: {
            name: (value) => (value.length < 2 ? 'Nombre muy corto' : null),
            // cuit: (value) => (/^\d{2}-\d{8}-\d{1}$|^\d{11}$/.test(value) ? null : 'CUIT inválido') // Optional validation
        },
    });

    const fetchClients = async () => {
        try {
            const res = await api.get('/clients');
            setClients(res.data);
        } catch (error) {
            console.error(error);
            notifications.show({ message: 'Error al cargar clientes', color: 'red' });
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleSubmit = async (values) => {
        try {
            if (editingId) {
                await api.put(`/clients/${editingId}`, values);
                notifications.show({ message: 'Cliente actualizado', color: 'green' });
            } else {
                await api.post('/clients', values);
                notifications.show({ message: 'Cliente creado', color: 'green' });
            }
            setOpened(false);
            form.reset();
            setEditingId(null);
            fetchClients();
        } catch (error) {
            console.error(error);
            notifications.show({
                message: error.response?.data?.error || 'Error al guardar',
                color: 'red'
            });
        }
    };

    const handleEdit = (client) => {
        setEditingId(client.id);
        form.setValues({
            name: client.name,
            cuit: client.cuit || '',
            email: client.email || '',
            address: client.address || '',
            taxCondition: client.taxCondition
        });
        setOpened(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este cliente?')) return;
        try {
            await api.delete(`/clients/${id}`);
            notifications.show({ message: 'Cliente eliminado', color: 'green' });
            fetchClients();
        } catch (error) {
            console.error(error);
            notifications.show({
                message: error.response?.data?.error || 'Error al eliminar',
                color: 'red'
            });
        }
    };

    const rows = clients.map((client) => (
        <Table.Tr key={client.id}>
            <Table.Td>{client.name}</Table.Td>
            <Table.Td>{client.cuit || '-'}</Table.Td>
            <Table.Td>{client.taxCondition}</Table.Td>
            <Table.Td>
                <Group gap={0} justify="flex-end">
                    <ActionIcon variant="subtle" color="gray" onClick={() => handleEdit(client)}>
                        <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(client.id)}>
                        <IconTrash size={16} />
                    </ActionIcon>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <>
            <Group justify="space-between" mb="lg">
                <Title order={2}>Clientes</Title>
                <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditingId(null); form.reset(); setOpened(true); }}>
                    Nuevo Cliente
                </Button>
            </Group>

            <Paper shadow="xs" p="md">
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Nombre</Table.Th>
                            <Table.Th>CUIT</Table.Th>
                            <Table.Th>Condición Fiscal</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Paper>

            <Modal opened={opened} onClose={() => setOpened(false)} title={editingId ? "Editar Cliente" : "Nuevo Cliente"}>
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput label="Nombre / Razón Social" placeholder="Juan Perez" required mb="sm" {...form.getInputProps('name')} />
                    <TextInput label="CUIT" placeholder="20-12345678-9" mb="sm" {...form.getInputProps('cuit')} />
                    <Select
                        label="Condición Fiscal"
                        data={[
                            { value: 'CONSUMIDOR_FINAL', label: 'Consumidor Final' },
                            { value: 'RESPONSABLE_INSCRIPTO', label: 'Responsable Inscripto' },
                            { value: 'MONOTRIBUTISTA', label: 'Monotributista' },
                            { value: 'EXENTO', label: 'Exento' }
                        ]}
                        mb="sm"
                        {...form.getInputProps('taxCondition')}
                    />
                    <TextInput label="Email" placeholder="juan@mail.com" mb="sm" {...form.getInputProps('email')} />
                    <TextInput label="Dirección" placeholder="Av. Siempre Viva 123" mb="lg" {...form.getInputProps('address')} />

                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setOpened(false)}>Cancelar</Button>
                        <Button type="submit">Guardar</Button>
                    </Group>
                </form>
            </Modal>
        </>
    );
}
