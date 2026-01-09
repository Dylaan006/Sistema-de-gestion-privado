import { useState } from 'react';
import { TextInput, PasswordInput, Button, Container, Paper, Title, Text, Alert } from '@mantine/core';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(email, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
    };

    return (
        <Container size={420} my={40}>
            <Title align="center">Sistema de Gestión</Title>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                {error && <Alert color="red" mb="md">{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <TextInput
                        label="Email"
                        placeholder="admin@test.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.currentTarget.value)}
                    />
                    <PasswordInput
                        label="Contraseña"
                        placeholder="Tu contraseña"
                        required
                        mt="md"
                        value={password}
                        onChange={(e) => setPassword(e.currentTarget.value)}
                    />
                    <Button fullWidth mt="xl" type="submit">
                        Ingresar
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}
