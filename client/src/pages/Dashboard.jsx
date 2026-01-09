import { useState, useEffect } from 'react';
import { Grid, Paper, Text, Group, Title, ThemeIcon, RingProgress, Center, Table, Badge } from '@mantine/core';
import { IconCash, IconTrendingUp, IconShoppingCart, IconHistory } from '@tabler/icons-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';

export default function Dashboard() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/stats/dashboard');
                setStats(res.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchStats();
    }, []);

    if (!stats) return <Text>Cargando estadísticas...</Text>;

    const profitMargin = stats.totalRevenue > 0
        ? ((stats.grossProfit / stats.totalRevenue) * 100).toFixed(0)
        : 0;

    const recentRows = stats.recentSales?.map((sale) => (
        <Table.Tr key={sale.id}>
            <Table.Td>{new Date(sale.date).toLocaleDateString()}</Table.Td>
            <Table.Td>{sale.clientName}</Table.Td>
            <Table.Td><Badge variant="light">{sale.invoiceType}</Badge></Table.Td>
            <Table.Td>${Number(sale.total).toLocaleString()}</Table.Td>
        </Table.Tr>
    ));

    return (
        <div>
            <Title order={2} mb="xl">Resumen del Negocio</Title>

            {/* KEY METRICS */}
            <Grid mb="lg">
                <Grid.Col span={4}>
                    <Paper shadow="sm" p="md" radius="md" withBorder>
                        <Group justify="space-between">
                            <div>
                                <Text c="dimmed" tt="uppercase" fw={700} fz="xs">Ingresos (30 días)</Text>
                                <Text fw={700} fz="xl">${stats.totalRevenue.toLocaleString()}</Text>
                            </div>
                            <ThemeIcon color="blue" variant="light" size={38} radius="md">
                                <IconCash size="1.8rem" stroke={1.5} />
                            </ThemeIcon>
                        </Group>
                    </Paper>
                </Grid.Col>

                <Grid.Col span={4}>
                    <Paper shadow="sm" p="md" radius="md" withBorder>
                        <Group justify="space-between">
                            <div>
                                <Text c="dimmed" tt="uppercase" fw={700} fz="xs">Ganancia Bruta</Text>
                                <Text fw={700} fz="xl" c="green">${stats.grossProfit.toLocaleString()}</Text>
                            </div>
                            <RingProgress
                                size={60}
                                roundCaps
                                thickness={6}
                                sections={[{ value: profitMargin, color: 'green' }]}
                                label={<Center><IconTrendingUp size="1.2rem" /></Center>}
                            />
                        </Group>
                        <Text c="dimmed" fz="xs">Margen: {profitMargin}%</Text>
                    </Paper>
                </Grid.Col>

                <Grid.Col span={4}>
                    <Paper shadow="sm" p="md" radius="md" withBorder>
                        <Group justify="space-between">
                            <div>
                                <Text c="dimmed" tt="uppercase" fw={700} fz="xs">Costos Stock</Text>
                                <Text fw={700} fz="xl">${Number(stats.totalExpenses).toLocaleString()}</Text>
                            </div>
                            <ThemeIcon color="red" variant="light" size={38} radius="md">
                                <IconShoppingCart size="1.8rem" stroke={1.5} />
                            </ThemeIcon>
                        </Group>
                    </Paper>
                </Grid.Col>
            </Grid>

            <Grid>
                {/* CHART SECTION */}
                <Grid.Col span={8}>
                    <Paper shadow="sm" p="md" radius="md" withBorder h={400}>
                        <Title order={4} mb="md">Ventas Últimos 7 Días</Title>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.chartData || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `$${value}`} />
                                    <Bar dataKey="revenue" fill="#228be6" name="Ingresos" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Paper>
                </Grid.Col>

                {/* RECENT TRANSACTIONS */}
                <Grid.Col span={4}>
                    <Paper shadow="sm" p="md" radius="md" withBorder h={400}>
                        <Group mb="md" gap="xs">
                            <IconHistory size={20} />
                            <Title order={4}>Últimas Ventas</Title>
                        </Group>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Fecha</Table.Th>
                                    <Table.Th>Cliente</Table.Th>
                                    <Table.Th>Tipo</Table.Th>
                                    <Table.Th>Total</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{recentRows}</Table.Tbody>
                        </Table>
                    </Paper>
                </Grid.Col>
            </Grid>
        </div>
    );
}
