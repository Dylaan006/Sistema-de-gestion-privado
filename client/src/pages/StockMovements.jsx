import { useState, useEffect } from 'react';
import { Title, Table, Paper, Badge, Group, Loader, Text } from '@mantine/core';
import api from '../api/axios';
import { IconArrowUpRight, IconArrowDownRight, IconExchange } from '@tabler/icons-react';

export default function StockMovements() {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMovements = async () => {
            try {
                const res = await api.get('/stock/movements');
                setMovements(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchMovements();
    }, []);

    const getTypeBadge = (type) => {
        switch (type) {
            case 'IN': return { color: 'green', label: 'Entrada', icon: <IconArrowDownRight size={14} /> };
            case 'OUT': return { color: 'red', label: 'Salida', icon: <IconArrowUpRight size={14} /> };
            default: return { color: 'blue', label: 'Ajuste', icon: <IconExchange size={14} /> };
        }
    };

    const rows = movements.map((m) => {
        const typeInfo = getTypeBadge(m.type);
        return (
            <Table.Tr key={m.id}>
                <Table.Td>
                    {new Date(m.createdAt).toLocaleString()}
                </Table.Td>
                <Table.Td>{m.product?.name || 'Desconocido'}</Table.Td>
                <Table.Td>
                    <Badge color={typeInfo.color} leftSection={typeInfo.icon}>
                        {typeInfo.label}
                    </Badge>
                </Table.Td>
                <Table.Td style={{ fontWeight: 700 }}>
                    {m.quantity}
                </Table.Td>
                <Table.Td>{m.reason || '-'}</Table.Td>
                <Table.Td><Text size="sm" c="dimmed">{m.user?.name || 'Usuario'}</Text></Table.Td>
            </Table.Tr>
        );
    });

    return (
        <Paper shadow="xs" p="md">
            <Title order={2} mb="lg">Historial de Stock</Title>

            {loading ? <Loader /> : (
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Fecha</Table.Th>
                            <Table.Th>Producto</Table.Th>
                            <Table.Th>Tipo</Table.Th>
                            <Table.Th>Cantidad</Table.Th>
                            <Table.Th>Motivo</Table.Th>
                            <Table.Th>Usuario</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            )}
        </Paper>
    );
}
