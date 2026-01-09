import PDFDocument from 'pdfkit';

class PdfService {
    generateInvoice(sale, organization, res) {
        const doc = new PDFDocument({ margin: 50 });

        this.generateHeader(doc, organization);
        this.generateCustomerInformation(doc, sale);
        this.generateInvoiceTable(doc, sale);
        this.generateFooter(doc, sale);

        // Pipe directly to response
        doc.pipe(res);
        doc.end();
    }

    generateHeader(doc, org) {
        doc
            .fillColor('#444444')
            .fontSize(20)
            .text(org.name || 'Empresa Sin Nombre', 50, 57) // Mock Logo area left empty
            .fontSize(10)
            .text('CUIT: ' + (org.cuit || '20-00000000-1'), 200, 50, { align: 'right' })
            .text('Dirección: Calle Falsa 123', 200, 65, { align: 'right' })
            .moveDown();
    }

    generateCustomerInformation(doc, sale) {
        const customer = sale.client || { name: 'Consumidor Final', cuit: '00-00000000-0' };

        doc
            .fillColor('#444444')
            .fontSize(20)
            .text('FACTURA ' + (sale.invoiceType || 'B'), 50, 160);

        this.generateHr(doc, 185);

        const customerInformationTop = 200;

        doc
            .fontSize(10)
            .text("Cliente:", 50, customerInformationTop)
            .font("Helvetica-Bold")
            .text(customer.name, 150, customerInformationTop)
            .font("Helvetica")
            .text("CUIT:", 50, customerInformationTop + 15)
            .text(customer.cuit || '-', 150, customerInformationTop + 15)
            .text("Fecha:", 50, customerInformationTop + 30)
            .text(new Date(sale.date).toLocaleDateString(), 150, customerInformationTop + 30)

            .moveDown();

        this.generateHr(doc, 252);
    }

    generateInvoiceTable(doc, sale) {
        let i;
        const invoiceTableTop = 330;

        doc.font("Helvetica-Bold");
        this.generateTableRow(
            doc,
            invoiceTableTop,
            "Item",
            "Cant.",
            "Precio Unit.",
            "Total"
        );
        this.generateHr(doc, invoiceTableTop + 20);
        doc.font("Helvetica");

        let position = invoiceTableTop + 30;

        sale.items.forEach(item => {
            this.generateTableRow(
                doc,
                position,
                item.product?.name || 'Producto',
                item.quantity,
                item.unitPrice,
                (item.quantity * item.unitPrice).toFixed(2)
            );
            position += 20;
        });

        this.generateHr(doc, position + 10);

        // Total
        const subtotalPosition = position + 30;
        doc.font("Helvetica-Bold");
        this.generateTableRow(
            doc,
            subtotalPosition,
            "",
            "",
            "TOTAL",
            sale.total
        );
    }

    generateFooter(doc, sale) {
        const footerTop = 700;

        doc
            .fontSize(10)
            .text(
                "CAE: " + (sale.cae || '12345678901234 (Simulado)'),
                50,
                footerTop,
                { align: "center", width: 500 }
            )
            .text(
                "Vto. CAE: " + (sale.caeExpiration ? new Date(sale.caeExpiration).toLocaleDateString() : '01/01/2030'),
                50,
                footerTop + 15,
                { align: "center", width: 500 }
            );
    }

    generateTableRow(doc, y, item, quantity, unitCost, lineTotal) {
        doc
            .fontSize(10)
            .text(item, 50, y)
            .text(quantity, 280, y, { width: 90, align: "right" })
            .text(unitCost, 370, y, { width: 90, align: "right" })
            .text(lineTotal, 0, y, { align: "right" });
    }

    generateHr(doc, y) {
        doc
            .strokeColor("#aaaaaa")
            .lineWidth(1)
            .moveTo(50, y)
            .lineTo(550, y)
            .stroke();
    }
}

export default new PdfService();
