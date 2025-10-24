import type { QuoteData } from './QuoteGenerator'
import type { Property, Service } from '@/types/database'

interface QuoteTemplateProps {
  quote: QuoteData & { id?: string; createdAt?: string }
  property?: Property
  services?: Service[]
}

export function QuoteTemplate({ quote, property }: QuoteTemplateProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Split items into chunks for better page breaks (max 15 items per page)
  const itemsPerPage = 15
  const itemChunks = []
  for (let i = 0; i < quote.items.length; i += itemsPerPage) {
    itemChunks.push(quote.items.slice(i, i + itemsPerPage))
  }

  return (
    <div 
      style={{ 
        backgroundColor: '#ffffff',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        lineHeight: '1.4',
        padding: '20px'
      }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .page-break-before { page-break-before: always; }
            .page-break-after { page-break-after: always; }
            .page-break-avoid { page-break-inside: avoid; }
            .no-page-break { page-break-inside: avoid; }
          }
          
          .pdf-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          .pdf-table th,
          .pdf-table td {
            border: 1px solid #e5e7eb;
            padding: 8px 12px;
            text-align: left;
            font-size: 12px;
          }
          
          .pdf-table th {
            background-color: #f9fafb;
            font-weight: bold;
          }
          
          .pdf-section {
            margin-bottom: 25px;
          }
        `
      }} />

      <div className="page-break-avoid" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '8px', margin: '0 0 8px 0' }}>Paris Janitor</h1>
            <div style={{ width: '64px', height: '4px', marginBottom: '16px', backgroundColor: '#2563eb' }}></div>
            <p style={{ color: '#6b7280', margin: '0' }}>Conciergerie immobilière</p>
            <p style={{ color: '#6b7280', margin: '0' }}>Paris, France</p>
            <p style={{ color: '#6b7280', margin: '0' }}>contact@parisjanitor.com</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px', margin: '0 0 8px 0' }}>DEVIS</h2>
            <p style={{ color: '#6b7280', margin: '0' }}>N° {quote.id || 'DRAFT'}</p>
            <p style={{ color: '#6b7280', margin: '0' }}>Date: {quote.createdAt ? formatDate(quote.createdAt) : getCurrentDate()}</p>
          </div>
        </div>
      </div>

      <div className="pdf-section page-break-avoid">
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', margin: '0 0 16px 0' }}>
          Informations client
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <div>
            <p style={{ fontWeight: '500', color: '#111827', margin: '0' }}>{quote.clientName}</p>
            <p style={{ color: '#6b7280', margin: '0' }}>{quote.clientEmail}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            {quote.validUntil && (
              <p style={{ color: '#6b7280', margin: '0' }}>
                <span style={{ fontWeight: '500' }}>Valide jusqu'au:</span> {formatDate(quote.validUntil)}
              </p>
            )}
          </div>
        </div>
      </div>

      {property && (
        <div className="pdf-section page-break-avoid">
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', margin: '0 0 16px 0' }}>
            Propriété concernée
          </h3>
          <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
            <p style={{ fontWeight: '500', color: '#111827', margin: '0' }}>{property.title}</p>
            <p style={{ color: '#6b7280', margin: '0' }}>{property.address}</p>
            <p style={{ color: '#6b7280', margin: '0' }}>{property.city}, {property.postal_code}</p>
            {property.description && (
              <p style={{ color: '#6b7280', marginTop: '8px', margin: '8px 0 0 0' }}>{property.description}</p>
            )}
          </div>
        </div>
      )}

      <div className="pdf-section">
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', margin: '0 0 16px 0' }} className="page-break-avoid">
          Détail des services
        </h3>
        
        {itemChunks.map((chunk, chunkIndex) => (
          <div key={chunkIndex} className={chunkIndex > 0 ? "page-break-before" : ""}>
            {chunkIndex > 0 && (
              <h4 style={{ fontSize: '16px', fontWeight: '500', color: '#374151', marginBottom: '12px', margin: '0 0 12px 0' }}>
                Services (suite - page {chunkIndex + 1})
              </h4>
            )}
            
            <div style={{ overflow: 'hidden', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '24px' }}>
              <table className="pdf-table" style={{ width: '100%' }}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#111827' }}>Service</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#111827' }}>Description</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '500', color: '#111827' }}>Quantité</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#111827' }}>Prix unitaire</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#111827' }}>Total</th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: '1px solid #e5e7eb' }}>
                  {chunk.map((item, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>{item.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>{item.description}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#111827', textAlign: 'right' }}>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="pdf-section page-break-avoid">
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '320px' }}>
            <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#6b7280' }}>Sous-total:</span>
                  <span style={{ fontWeight: '500', color: '#111827' }}>{formatCurrency(quote.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#6b7280' }}>Commission Paris Janitor (20%):</span>
                  <span style={{ fontWeight: '500', color: '#111827' }}>{formatCurrency(quote.commission)}</span>
                </div>
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Total TTC:</span>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb' }}>{formatCurrency(quote.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {quote.notes && (
        <div className="pdf-section page-break-avoid">
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', margin: '0 0 16px 0' }}>
            Notes
          </h3>
          <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
            <p style={{ color: '#6b7280', whiteSpace: 'pre-wrap', margin: '0' }}>{quote.notes}</p>
          </div>
        </div>
      )}

      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '32px' }} className="page-break-avoid">
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', margin: '0 0 16px 0' }}>Conditions générales</h3>
        <div style={{ fontSize: '14px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ margin: '0' }}>• Ce devis est valable {quote.validUntil ? `jusqu'au ${formatDate(quote.validUntil)}` : '30 jours à compter de la date d\'émission'}.</p>
          <p style={{ margin: '0' }}>• Les prestations seront facturées selon les tarifs en vigueur au moment de l'exécution.</p>
          <p style={{ margin: '0' }}>• Paris Janitor prélève une commission de 20% sur le montant des prestations.</p>
          <p style={{ margin: '0' }}>• Les paiements s'effectuent via notre plateforme sécurisée.</p>
          <p style={{ margin: '0' }}>• Toute prestation annulée moins de 24h avant son exécution sera facturée à 50%.</p>
        </div>
      </div>

      <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #e5e7eb' }} className="page-break-avoid">
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#9ca3af' }}>
          <p style={{ margin: '0' }}>Paris Janitor - Conciergerie immobilière</p>
          <p style={{ margin: '0' }}>SIRET: 123 456 789 00012 | TVA: FR12345678901</p>
          <p style={{ margin: '0' }}>www.parisjanitor.com | contact@parisjanitor.com</p>
        </div>
      </div>
    </div>
  )
}