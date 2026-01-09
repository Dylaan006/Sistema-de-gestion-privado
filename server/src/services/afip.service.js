// import Afip from '@afipsdk/afip.js'; // Commented out until we have certificates
const Afip = null; // Mock for now

class AfipService {
    constructor() {
        // In real mode:
        // this.afip = new Afip({ CUIT: process.env.AFIP_CUIT, cert: ..., key: ... });
        this.mode = 'MOCK'; // 'REAL' or 'MOCK'
    }

    async createVoucher(sale) {
        if (this.mode === 'MOCK') {
            return this.mockVoucher(sale);
        }

        // TODO: Real Implementation
        throw new Error('Real AFIP mode implemented yet');
    }

    async getPersona(cuit) {
        if (this.mode === 'MOCK') {
            return this.mockPersona(cuit);
        }
        // TODO: Real Implementation
        // const data = await this.afip.RegisterScopeFive.getTaxpayerDetails(cuit);
        // return data;
        throw new Error('Real AFIP mode implemented yet');
    }

    async mockVoucher(sale) {
        console.log(`[AFIP MOCK] Generando CAE para venta de $${sale.total}`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        return {
            cae: '12345678901234', // Mock CAE
            caeExpiration: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
            invoiceNumber: Math.floor(Math.random() * 10000)
        };
    }

    async mockPersona(cuit) {
        console.log(`[AFIP MOCK] Buscando persona CUIT ${cuit}`);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Return mock data based on CUIT ending
        if (cuit.endsWith('9')) {
            throw new Error('CUIT Inexistente o Inválido');
        }

        return {
            nombre: 'MOCK COMPANY S.A.',
            domicilio: 'Calle Falsa 123, CABA',
            condicionIVA: 'RESPONSABLE_INSCRIPTO'
        };
    }
}

export default new AfipService();
