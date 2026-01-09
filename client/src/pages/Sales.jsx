import { useState, useEffect } from 'react';
import { Table, Title, Container, Button, Paper, Group, Text, ActionIcon, Modal } from '@mantine/core';
import { IconFileTypePdf, IconBan } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import api from '../api/axios';

export default function Sales() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    // Refund Modal State
    const [refundModalOpened, { open: openRefundModal, close: closeRefundModal }] = useDisclosure(false);
    const [saleToRefund, setSaleToRefund] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const response = await api.get('/sales');
            setSales(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async (saleId) => {
        notifications.show({ id: 'download-pdf', loading: true, title: 'Descargando PDF', message: 'Por favor espere...', autoClose: false, withCloseButton: false });
        try {
            const response = await api.get(`/sales/${saleId}/pdf`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Factura-${saleId}.pdf`);
            document.body.appendChild(link);
            link.click();

            // Clean up
            link.remove();
            window.URL.revokeObjectURL(url);

            notifications.update({ id: 'download-pdf', title: 'Descarga Lista', message: 'La factura se ha descargado.', color: 'green', loading: false, autoClose: 3000 });
        } catch (error) {
            console.error('Error downloading PDF', error);
            notifications.update({ id: 'download-pdf', title: 'Error', message: 'No se pudo descargar el PDF.', color: 'red', loading: false, autoClose: 3000 });
        }
    };

    const confirmRefund = (sale) => {
        setSaleToRefund(sale);
        openRefundModal();
    };

    const handleRefund = async () => {
        if (!saleToRefund) return;
        setActionLoading(true);
        try {
            await api.post(`/sales/${saleToRefund.id}/refund`);
            notifications.show({ message: 'Venta anulada y Nota de Crédito generada', color: 'green' });
            fetchSales();
            closeRefundModal();
            setSaleToRefund(null);
        } catch (error) {
            console.error(error);
            notifications.show({
                message: error.response?.data?.error || 'Error al anular',
                color: 'red'
            });
        }
        setActionLoading(false);
    };

    const rows = sales.map((sale) => (
        <Table.Tr key={sale.id}>
            <Table.Td>#{sale.number || sale.id}</Table.Td>

            <Table.Td>{new Date(sale.date).toLocaleDateString()}</Table.Td>
            <Table.Td>{sale.invoiceType}</Table.Td>
            <Table.Td>${Number(sale.total).toFixed(2)}</Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <ActionIcon color="red" variant="subtle" title="Descargar PDF" onClick={() => handleDownloadPdf(sale.id)}>
                        <IconFileTypePdf size="1.2rem" />
                    </ActionIcon>
                    {/* Show Refund button only for Invoice types (A, B, X) and NOT already refunded */}
                    {['A', 'B', 'X'].includes(sale.invoiceType) && (
                        <ActionIcon
                            color="orange"
                            variant="subtle"
                            title="Anular (Nota de Crédito)"
                            onClick={() => confirmRefund(sale)}
                            disabled={sale.creditNotes && sale.creditNotes.length > 0} // Optional visual feedback if we had creditNotes in list
                        >
                            <IconBan size="1.2rem" />
                        </ActionIcon>
                    )}
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Container size="xl">
            <Title order={2} mb="md">Historial de Ventas</Title>
            <Paper shadow="xs" p="md">
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Fecha</Table.Th>
                            <Table.Th>Tipo</Table.Th>
                            <Table.Th>Total</Table.Th>
                            <Table.Th>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Paper>

            {/* Refund Confirmation Modal */}
            <Modal opened={refundModalOpened} onClose={closeRefundModal} title="Confirmar Anulación" centered>
                <Text size="sm" mb="lg">
                    ¿Estás seguro de <b>ANULAR</b> la venta #{saleToRefund?.id}?
                    <br />
                    Esta acción devolverá el stock y generará una Nota de Crédito.
                </Text>
                <Group position="right">
                    <Button variant="default" onClick={closeRefundModal}>Cancelar</Button>
                    <Button color="red" onClick={handleRefund} loading={actionLoading}>Confirmar Anulación</Button>
                </Group>
            </Modal>
        </Container>
    );
}
