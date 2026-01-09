import { useState, useEffect } from 'react';
import { Title, Table, Button, Group, Modal, TextInput, Select, PasswordInput, Badge, ActionIcon, Paper } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconBan } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import api from '../api/axios';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [opened, { open, close }] = useDisclosure(false);
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            name: '',
            email: '',
            password: '',
            role: 'OPERATOR'
        },
        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Email inválido'),
            password: (value) => (value.length < 6 ? 'Mínimo 6 caracteres' : null),
            name: (value) => (value.length < 2 ? 'Nombre requerido' : null)
        }
    });

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
            // If 403, might be handled by global interceptor or user just sees empty
            if (error.response?.status === 403) {
                notifications.show({ message: 'No tienes permiso para ver usuarios', color: 'red' });
            }
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            await api.post('/users', values);
            notifications.show({ message: 'Usuario creado', color: 'green' });
            fetchUsers();
            close();
            form.reset();
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || 'Error al crear usuario',
                color: 'red'
            });
        }
        setLoading(false);
    };

    const handleDisable = async (id) => {
        if (!window.confirm('¿Seguro que deseas desactivar este usuario?')) return;
        try {
            await api.patch(`/users/${id}/disable`);
            notifications.show({ message: 'Usuario desactivado', color: 'green' });
            fetchUsers();
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || 'Error al desactivar',
                color: 'red'
            });
        }
    };

    const rows = users.map((user) => (
        <Table.Tr key={user.id}>
            <Table.Td>{user.name || '-'}</Table.Td>
            <Table.Td>{user.email}</Table.Td>
            <Table.Td>
                <Badge color={user.role === 'ADMIN' ? 'red' : 'blue'}>{user.role}</Badge>
            </Table.Td>
            <Table.Td>
                <Badge color={user.isActive ? 'green' : 'gray'}>{user.isActive ? 'Activo' : 'Inactivo'}</Badge>
            </Table.Td>
            <Table.Td>
                {user.isActive && (
                    <ActionIcon color="red" variant="subtle" title="Desactivar" onClick={() => handleDisable(user.id)}>
                        <IconBan size={16} />
                    </ActionIcon>
                )}
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <>
            <Group justify="space-between" mb="lg">
                <Title order={2}>Usuarios</Title>
                <Button leftSection={<IconPlus size={16} />} onClick={open}>
                    Nuevo Usuario
                </Button>
            </Group>

            <Paper shadow="xs" p="md">
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Nombre</Table.Th>
                            <Table.Th>Email</Table.Th>
                            <Table.Th>Rol</Table.Th>
                            <Table.Th>Estado</Table.Th>
                            <Table.Th>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Paper>

            <Modal opened={opened} onClose={close} title="Nuevo Usuario">
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput label="Nombre" placeholder="Nombre completo" mb="sm" {...form.getInputProps('name')} />
                    <TextInput label="Email" placeholder="usuario@empresa.com" mb="sm" required {...form.getInputProps('email')} />
                    <PasswordInput label="Contraseña" placeholder="******" mb="sm" required {...form.getInputProps('password')} />
                    <Select
                        label="Rol"
                        data={['OPERATOR', 'STAFF', 'ADMIN']}
                        mb="lg"
                        {...form.getInputProps('role')}
                    />
                    <Button type="submit" fullWidth loading={loading}>Crear Usuario</Button>
                </form>
            </Modal>
        </>
    );
}
