import jsPDF from 'jspdf';

export interface InvoiceData {
  order: {
    id: string;
    fullName: string;
    phone: string;
    address: string;
    wilaya: string;
    commune?: string;
    communeName?: string;
    wilayaName?: string;
    createdAt: string;
    status: string;
    totalPrice: number;
    deliveryPrice?: number;
    deliveryType?: string;
    product: {
      titleFr: string;
      titleAr: string;
      price: number;
      images: string[];
    };
    quantity?: number;
    selectedColor?: {
      name?: string;
      image?: string;
    };
    notes?: string;
  };
  settings?: {
    siteName?: string;
    logoUrl?: string;
    logoSize?: number;
    contactPhone?: string;
    contactEmail?: string;
    invoice?: {
      storeName?: string;
      businessName?: string;
      nif?: string;
      nis?: string;
      rc?: string;
      address?: string;
      wilaya?: string;
      phone?: string;
      email?: string;
      footerNote?: string;
    };
  };
}

export const generateInvoicePDF = async (data: InvoiceData) => {
  const { order, settings } = data;
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  const storeName = settings?.invoice?.storeName || settings?.siteName || 'Sanaa Collection';

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(93, 64, 55);
  doc.text(storeName, margin, y);

  y += 10;

  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('FACTURE', margin, y);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const orderNumber = `#${order.id.substring(0, 8).toUpperCase()}`;
  const orderDate = new Date(order.createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  doc.text(`N° ${orderNumber}`, pageWidth - margin, y - 10, { align: 'right' });
  doc.text(`Date: ${orderDate}`, pageWidth - margin, y, { align: 'right' });

  y += 15;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURÉ À', margin, y);

  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(order.fullName, margin, y);

  y += 5;
  doc.text(`Tél: ${order.phone}`, margin, y);

  y += 5;
  doc.text(order.wilayaName || order.wilaya, margin, y);

  if (order.communeName) {
    y += 5;
    doc.text(order.communeName, margin, y);
  }

  y += 5;
  const addressLines = doc.splitTextToSize(order.address, 80);
  addressLines.forEach((line: string) => {
    doc.text(line, margin, y);
    y += 5;
  });

  y += 10;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉTAILS', margin, y);

  y += 10;

  const tableTop = y;
  const rowHeight = 8;
  const col1X = margin;
  const col2X = margin + 75;
  const col3X = margin + 105;
  const col4X = pageWidth - margin - 60;
  const col5X = pageWidth - margin - 3;

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, pageWidth - 2 * margin, rowHeight, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  doc.text('PRODUIT', col1X + 2, y + 5.5);
  doc.text('COULEUR', col2X + 2, y + 5.5);
  doc.text('QTÉ', col3X + 2, y + 5.5);
  doc.text('PRIX UNIT.', col4X, y + 5.5);
  doc.text('TOTAL', col5X, y + 5.5, { align: 'right' });

  y += rowHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const productName = order.product.titleFr;
  const productLines = doc.splitTextToSize(productName, 75);
  const productText = productLines.length > 0 ? productLines[0] : productName;

  const quantity = order.quantity || 1;
  const unitPrice = order.product.price;
  const lineTotal = unitPrice * quantity;
  const colorName = order.selectedColor?.name || '-';

  doc.text(productText, col1X + 2, y + 5.5);
  doc.text(colorName, col2X + 2, y + 5.5);
  doc.text(quantity.toString(), col3X + 2, y + 5.5);
  doc.text(`${unitPrice.toFixed(2)} DA`, col4X, y + 5.5);
  doc.text(`${lineTotal.toFixed(2)} DA`, col5X, y + 5.5, { align: 'right' });

  y += rowHeight + 5;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;

  const totalsX = pageWidth - margin - 60;
  const valuesX = pageWidth - margin;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const subtotal = lineTotal;
  const deliveryPrice = order.deliveryPrice || 0;
  const total = order.totalPrice;

  doc.text('Sous-total:', totalsX, y);
  doc.text(`${subtotal.toFixed(2)} DA`, valuesX, y, { align: 'right' });

  y += 6;

  let deliveryLabel = 'Livraison';
  if (order.deliveryType === 'bureau') {
    deliveryLabel = 'Livraison (Bureau)';
  } else if (order.deliveryType === 'domicile') {
    deliveryLabel = 'Livraison (Domicile)';
  }

  doc.text(`${deliveryLabel}:`, totalsX, y);
  doc.text(`${deliveryPrice.toFixed(2)} DA`, valuesX, y, { align: 'right' });

  y += 8;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y, valuesX, y);

  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', totalsX, y);
  doc.text(`${total.toFixed(2)} DA`, valuesX, y, { align: 'right' });

  y += 15;

  const statusLabels: { [key: string]: string } = {
    pending: 'En attente',
    preparing: 'En préparation',
    shipping: 'En cours de livraison',
    delivered: 'Livrée',
    completed: 'Complétée',
    cancelled: 'Annulée',
  };

  const statusLabel = statusLabels[order.status] || order.status;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Statut: ${statusLabel}`, margin, y);

  if (order.notes && order.notes.trim()) {
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Notes:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const notesLines = doc.splitTextToSize(order.notes, pageWidth - 2 * margin);
    notesLines.forEach((line: string) => {
      if (y > pageHeight - 60) return;
      doc.text(line, margin, y);
      y += 4;
    });
  }

  const footerY = pageHeight - 40;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  let footerCurrentY = footerY + 6;

  if (settings?.invoice) {
    const inv = settings.invoice;

    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');

    const businessInfo: string[] = [];
    if (inv.nif) businessInfo.push(`NIF: ${inv.nif}`);
    if (inv.nis) businessInfo.push(`NIS: ${inv.nis}`);
    if (inv.rc) businessInfo.push(`RC: ${inv.rc}`);

    if (businessInfo.length > 0) {
      doc.text(businessInfo.join('  |  '), pageWidth / 2, footerCurrentY, { align: 'center' });
      footerCurrentY += 4;
    }

    const addressParts: string[] = [];
    if (inv.address) addressParts.push(inv.address);
    if (inv.wilaya) addressParts.push(inv.wilaya);

    if (addressParts.length > 0) {
      doc.text(addressParts.join(', '), pageWidth / 2, footerCurrentY, { align: 'center' });
      footerCurrentY += 4;
    }

    const contactParts: string[] = [];
    if (inv.phone) contactParts.push(`Tél: ${inv.phone}`);
    if (inv.email) contactParts.push(inv.email);

    if (contactParts.length > 0) {
      doc.text(contactParts.join('  |  '), pageWidth / 2, footerCurrentY, { align: 'center' });
      footerCurrentY += 4;
    }

    if (inv.footerNote) {
      footerCurrentY += 1;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(93, 64, 55);
      doc.text(inv.footerNote, pageWidth / 2, footerCurrentY, { align: 'center' });
    }
  } else {
    doc.setFontSize(9);
    doc.setTextColor(93, 64, 55);
    doc.setFont('helvetica', 'italic');
    doc.text('Merci pour votre commande!', pageWidth / 2, footerCurrentY, { align: 'center' });

    if (settings?.contactPhone) {
      footerCurrentY += 4;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(`Contact: ${settings.contactPhone}`, pageWidth / 2, footerCurrentY, { align: 'center' });
    }
  }

  return doc;
};

export const downloadInvoice = async (data: InvoiceData) => {
  const pdf = await generateInvoicePDF(data);
  const orderNumber = data.order.id.substring(0, 8).toUpperCase();
  pdf.save(`facture-${orderNumber}.pdf`);
};

export const getInvoicePDFBlob = async (data: InvoiceData): Promise<Blob> => {
  const pdf = await generateInvoicePDF(data);
  return pdf.output('blob');
};
