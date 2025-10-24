import type { Property } from '@/types/database'

interface Booking {
  id: string
  status: string | null
  properties?: { title: string }
  created_at?: string
  total_amount?: number
  check_in?: string
  check_out?: string
}

interface InvoiceTemplateProps {
  bookings: Booking[]
  ownerId: string
  property?: Property
  period: 'month' | 'year'
  totalAmount: number
  subscriptionFee?: number
  serviceFees?: number
}

export function InvoiceTemplate({ 
  bookings, 
  ownerId, 
  property, 
  period,
  totalAmount,
  subscriptionFee = 100,
  serviceFees = 0
}: InvoiceTemplateProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date inconnue'
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

  const getPeriodLabel = () => {
    const now = new Date()
    if (period === 'month') {
      return now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    }
    return `Année ${now.getFullYear()}`
  }

  const commissionRate = 0.20
  const totalCommissions = totalAmount * commissionRate
  const netAmount = totalAmount - totalCommissions

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
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px', margin: '0 0 8px 0' }}>FACTURE</h2>
            <p style={{ color: '#6b7280', margin: '0' }}>N° INV-{ownerId.slice(0, 8).toUpperCase()}-{Date.now()}</p>
            <p style={{ color: '#6b7280', margin: '0' }}>Date: {getCurrentDate()}</p>
            <p style={{ color: '#6b7280', margin: '0' }}>Période: {getPeriodLabel()}</p>
          </div>
        </div>
      </div>

      <div className="pdf-section page-break-avoid">
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', margin: '0 0 16px 0' }}>
          Détail des réservations
        </h3>
        
        {bookings.length === 0 ? (
          <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', margin: '0' }}>Aucune réservation pour cette période</p>
          </div>
        ) : (
          <div style={{ overflow: 'hidden', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '24px' }}>
            <table className="pdf-table" style={{ width: '100%' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#111827' }}>Réservation</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#111827' }}>Propriété</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#111827' }}>Dates</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '500', color: '#111827' }}>Statut</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#111827' }}>Montant</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: '1px solid #e5e7eb' }}>
                {bookings.map((booking, index) => (
                  <tr key={booking.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                      #{booking.id.slice(0, 8)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                      {booking.properties?.title || 'Propriété inconnue'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      {formatDate(booking.created_at)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        backgroundColor: booking.status === 'confirmed' ? '#dcfce7' : '#fef3c7',
                        color: booking.status === 'confirmed' ? '#166534' : '#92400e'
                      }}>
                        {booking.status === 'confirmed' ? 'Confirmée' : 'En attente'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#111827', textAlign: 'right' }}>
                      {formatCurrency((booking.total_amount || 0) / 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="pdf-section page-break-avoid">
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', margin: '0 0 16px 0' }}>
          Récapitulatif financier
        </h3>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '400px' }}>
            <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#6b7280' }}>Total des réservations:</span>
                  <span style={{ fontWeight: '500', color: '#111827' }}>{formatCurrency(totalAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#6b7280' }}>Commission Paris Janitor (20%):</span>
                  <span style={{ fontWeight: '500', color: '#dc2626' }}>-{formatCurrency(totalCommissions)}</span>
                </div>
                {period === 'year' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#6b7280' }}>Abonnement annuel:</span>
                    <span style={{ fontWeight: '500', color: '#dc2626' }}>-{formatCurrency(subscriptionFee)}</span>
                  </div>
                )}
                {serviceFees > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#6b7280' }}>Frais de service:</span>
                    <span style={{ fontWeight: '500', color: '#dc2626' }}>-{formatCurrency(serviceFees)}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Montant net:</span>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#059669' }}>
                      {formatCurrency(netAmount - (period === 'year' ? subscriptionFee : 0) - serviceFees)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '32px' }} className="page-break-avoid">
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', margin: '0 0 16px 0' }}>Conditions</h3>
        <div style={{ fontSize: '14px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ margin: '0' }}>• Cette facture récapitule les revenus générés par vos propriétés sur la période indiquée.</p>
          <p style={{ margin: '0' }}>• La commission de 20% est prélevée automatiquement sur chaque réservation confirmée.</p>
          <p style={{ margin: '0' }}>• L'abonnement annuel de 100€ est facturé une fois par an.</p>
          <p style={{ margin: '0' }}>• Les montants sont exprimés en euros TTC.</p>
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
