import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Création des styles pour le PDF (Similaire au CSS)
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  
  // En-tête (Header)
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  businessName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  textMuted: { color: '#666', marginBottom: 2 },
  docTitle: { fontSize: 26, fontWeight: 'bold', color: '#2563eb', marginBottom: 4, textAlign: 'right' },
  docNumber: { fontSize: 12, color: '#666', textAlign: 'right' },

  // Informations Client et Dates
  infoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#9ca3af', marginBottom: 6 },
  clientName: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  dateRow: { marginBottom: 6 },
  dateLabel: { color: '#666', fontSize: 9, marginBottom: 1 },
  dateValue: { fontWeight: 'bold' },

  // Table
  table: { width: '100%', marginBottom: 30 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 6, marginBottom: 8 },
  tableHeaderCell: { color: '#666', fontSize: 9, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 8 },
  
  // Colonnes
  col1: { width: '40%' }, // Produit
  col2: { width: '15%', textAlign: 'center' }, // Quantité
  col3: { width: '15%', textAlign: 'right' }, // Prix unitaire
  col4: { width: '15%', textAlign: 'right' }, // TVA
  col5: { width: '15%', textAlign: 'right' }, // Total

  // Totaux
  totalsContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 40 },
  totalsBox: { width: '40%' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalTTC: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8, marginTop: 4 },
  totalTTCLabel: { fontSize: 12, fontWeight: 'bold' },
  totalTTCValue: { fontSize: 14, fontWeight: 'bold', color: '#2563eb' },

  // Pied de page
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 10 },
  footerText: { fontSize: 9, color: '#666', textAlign: 'center' }
});

// Formatage des dates
const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR");
};

export default function QuotePDF({ quote, business }: { quote: any, business: any }) {
  // Calcul des totaux pour le PDF
  const totals = quote?.quote_details?.reduce(
    (acc: any, item: any) => {
      const price = Number(item.products?.unit_price ?? 0);
      const taxRate = Number(item.products?.tax_rate ?? 0);
      const qty = item.quantity;

      const ht = price * qty;
      const tax = ht * (taxRate / 100);

      acc.ht += ht;
      acc.tax += tax;
      acc.ttc += ht + tax;
      return acc;
    },
    { ht: 0, tax: 0, ttc: 0 }
  ) || { ht: 0, tax: 0, ttc: 0 };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* --- HEADER --- */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.businessName}>{business?.name || "BusinessManager"}</Text>
            {business?.address && <Text style={styles.textMuted}>{business.address}</Text>}
            {business?.city && <Text style={styles.textMuted}>{business.city}, {business.country}</Text>}
            {business?.phone && <Text style={styles.textMuted}>{business.phone}</Text>}
          </View>
          <View>
            <Text style={styles.docTitle}>DEVIS</Text>
            <Text style={styles.docNumber}>N° {quote?.quote_id}</Text>
          </View>
        </View>

        {/* --- INFO CLIENT & DATES --- */}
        <View style={styles.infoContainer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>ADRESSÉ À</Text>
            <Text style={styles.clientName}>{quote?.clients?.name}</Text>
            {quote?.clients?.email && <Text style={styles.textMuted}>{quote.clients.email}</Text>}
            {quote?.clients?.phone && <Text style={styles.textMuted}>{quote.clients.phone}</Text>}
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Date d'émission</Text>
              <Text style={styles.dateValue}>{formatDate(quote?.issue_date)}</Text>
            </View>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Date d'expiration</Text>
              <Text style={styles.dateValue}>{formatDate(quote?.expiration_date)}</Text>
            </View>
          </View>
        </View>

        {/* --- TABLEAU DES ARTICLES --- */}
        <View style={styles.table}>
          {/* En-tête du tableau */}
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, styles.tableHeaderCell]}>PRODUIT</Text>
            <Text style={[styles.col2, styles.tableHeaderCell]}>QTÉ</Text>
            <Text style={[styles.col3, styles.tableHeaderCell]}>PRIX UNIT.</Text>
            <Text style={[styles.col4, styles.tableHeaderCell]}>TVA</Text>
            <Text style={[styles.col5, styles.tableHeaderCell]}>TOTAL TTC</Text>
          </View>

          {/* Lignes du tableau */}
          {quote?.quote_details?.map((item: any, index: number) => {
            const price = Number(item.products?.unit_price ?? 0);
            const taxRate = Number(item.products?.tax_rate ?? 0);
            const lineTTC = (price * item.quantity) * (1 + taxRate / 100);

            return (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.col1}>{item.products?.name}</Text>
                <Text style={styles.col2}>{item.quantity}</Text>
                <Text style={styles.col3}>{price.toFixed(2)} DT</Text>
                <Text style={styles.col4}>{taxRate}%</Text>
                <Text style={[styles.col5, { fontWeight: 'bold' }]}>{lineTTC.toFixed(2)} DT</Text>
              </View>
            );
          })}
        </View>

        {/* --- TOTAUX --- */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.textMuted}>Sous-total HT</Text>
              <Text>{totals.ht.toFixed(2)} DT</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.textMuted}>TVA</Text>
              <Text>{totals.tax.toFixed(2)} DT</Text>
            </View>
            <View style={styles.totalTTC}>
              <Text style={styles.totalTTCLabel}>Total TTC</Text>
              <Text style={styles.totalTTCValue}>{totals.ttc.toFixed(2)} DT</Text>
            </View>
          </View>
        </View>

        {/* --- PIED DE PAGE --- */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Validité : Ce devis est valable jusqu'au {formatDate(quote?.expiration_date)}. Merci pour votre confiance.
          </Text>
        </View>

      </Page>
    </Document>
  );
}