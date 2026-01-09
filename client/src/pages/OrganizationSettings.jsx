import { useState, useEffect } from 'react';
import { Title, Paper, TextInput, Button, Group, NumberInput, Text, Code, FileInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconCertificate, IconKey } from '@tabler/icons-react';
import api from '../api/axios';

export default function OrganizationSettings() {
    const [loading, setLoading] = useState(false);

    // For file handling, we might need to read file content as text
    const [crtFile, setCrtFile] = useState(null);
    const [keyFile, setKeyFile] = useState(null);

    const form = useForm({
        initialValues: {
            name: '',
            cuit: '',
            salesPoint: 1,
            grossIncome: '',
            startActivity: '',
            // Certificates are handled separately or via state
        }
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/organization');
                const org = res.data;
                form.setValues({
                    name: org.name || '',
                    cuit: org.cuit || '',
                    salesPoint: org.salesPoint || 1,
                    grossIncome: org.grossIncome || '',
                    startActivity: org.startActivity ? org.startActivity.split('T')[0] : ''
                });
            } catch (error) {
                console.error(error);
                notifications.show({ message: 'Error cargando configuración', color: 'red' });
            }
        };
        fetchSettings();
    }, []);

    const handleFileRead = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const updateData = { ...values };

            if (crtFile) {
                updateData.afipCrt = await handleFileRead(crtFile);
            }
            if (keyFile) {
                updateData.afipKey = await handleFileRead(keyFile);
            }

            await api.put('/organization', updateData);
            notifications.show({ message: 'Configuración actualizada', color: 'green' });
            setCrtFile(null);
            setKeyFile(null);
        } catch (error) {
            console.error(error);
            notifications.show({
                message: error.response?.data?.error || 'Error al guardar',
                color: 'red'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Title order={2} mb="lg">Configuración de Fiscal ("Mi Empresa")</Title>

            <Paper shadow="xs" p="xl" withBorder>
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Title order={4} mb="md">Datos Generales</Title>
                    <Group grow mb="md">
                        <TextInput label="Razón Social" {...form.getInputProps('name')} required />
                        <TextInput label="CUIT" placeholder="20-12345678-9" {...form.getInputProps('cuit')} required />
                    </Group>

                    <Group grow mb="md">
                        <NumberInput label="Punto de Venta" {...form.getInputProps('salesPoint')} min={1} />
                        <TextInput label="Ingresos Brutos" {...form.getInputProps('grossIncome')} />
                        <TextInput type="date" label="Inicio de Actividades" {...form.getInputProps('startActivity')} />
                    </Group>

                    <Title order={4} mt="xl" mb="md">Certificados AFIP</Title>
                    <Text size="sm" c="dimmed" mb="md">
                        Sube aquí los archivos .crt y .key generados para facturación electrónica.
                        Se guardarán en la base de datos de manera segura.
                    </Text>

                    <Group grow mb="lg">
                        <FileInput
                            label="Certificado (.crt)"
                            placeholder="Seleccionar archivo .crt"
                            leftSection={<IconCertificate size={16} />}
                            value={crtFile}
                            onChange={setCrtFile}
                            accept=".crt"
                            clearable
                        />
                        <FileInput
                            label="Llave Privada (.key)"
                            placeholder="Seleccionar archivo .key"
                            leftSection={<IconKey size={16} />}
                            value={keyFile}
                            onChange={setKeyFile}
                            accept=".key"
                            clearable
                        />
                    </Group>

                    <Button type="submit" loading={loading} fullWidth size="md">
                        GUARDAR CONFIGURACIÓN
                    </Button>
                </form>
            </Paper>
        </div>
    );
}
