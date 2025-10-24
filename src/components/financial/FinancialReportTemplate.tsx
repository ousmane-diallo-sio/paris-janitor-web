import type { FinancialData } from '@/services/financialService'

interface FinancialReportTemplateProps {
  data: FinancialData
  ownerId: string
  period: 'month' | 'year'
}

export function FinancialReportTemplate({ data, ownerId, period }: FinancialReportTemplateProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
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
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px', margin: '0 0 8px 0' }}>RAPPORT FINANCIER</h2>
            <p style={{ color: '#6b7280', margin: '0' }}>N° RPT-{ownerId.slice(0, 8).toUpperCase()}-{Date.now()}</p>
            <p style={{ color: '#6b7280', margin: '0' }}>Date: {getCurrentDate()}</p>
            <p style={{ color: '#6b7280', margin: '0' }}>Période: {getPeriodLabel()}</p>
          </div>
        </div>
      </div>

      <div className="pdf-section page-break-avoid">
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', margin: '0 0 16px 0' }}>
          Résumé exécutif
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#166534', margin: '0 0 8px 0' }}>Revenus</h4>
            <p style={{ fontSize: '24px', fontWeight: '700', color: '#166534', margin: '0' }}>
              {formatCurrency(period === 'month' ? data.monthlyRevenue : data.yearlyRevenue)}
            </p>
            <p style={{ fontSize: '12px', color: '#166534', margin: '4px 0 0 0' }}>
              {formatPercentage(data.revenueGrowth || 0)} vs période précédente
            </p>
          </div>
          <div style={{ backgroundColor: '#fef2f2', padding: '20px', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#dc2626', margin: '0 0 8px 0' }}>Dépenses</h4>
            <p style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626', margin: '0' }}>
              {formatCurrency(period === 'month' ? data.monthlyExpenses : data.yearlyExpenses)}
            </p>
            <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0 0' }}>
              {formatPercentage(data.expenseGrowth || 0)} vs période précédente
            </p>
          </div>
        </div>
        <div style={{ marginTop: '24px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#334155', margin: '0 0 8px 0' }}>Bénéfice net</h4>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#7c3aed', margin: '0' }}>
            {formatCurrency(period === 'month' ? data.monthlyNetIncome : data.yearlyNetIncome)}
          </p>
        </div>
      </div>

      {data.monthlyBreakdown && data.monthlyBreakdown.length > 0 && (
        <div className="pdf-section">
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', margin: '0 0 16px 0' }}>
            Évolution mensuelle
          </h3>
          <div style={{ overflow: 'hidden', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '24px' }}>
            <table className="pdf-table" style={{ width: '100%' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#111827' }}>Mois</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#111827' }}>Revenus</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#111827' }}>Dépenses</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#111827' }}>Bénéfice net</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: '1px solid #e5e7eb' }}>
                {data.monthlyBreakdown.map((month, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>{month.month}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#059669', textAlign: 'right' }}>{formatCurrency(month.revenue)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#dc2626', textAlign: 'right' }}>{formatCurrency(month.expenses)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: month.netIncome >= 0 ? '#059669' : '#dc2626', textAlign: 'right' }}>
                      {formatCurrency(month.netIncome)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.expenseCategories && data.expenseCategories.length > 0 && (
        <div className="pdf-section page-break-avoid">
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', margin: '0 0 16px 0' }}>
            Répartition des dépenses
          </h3>
          <div style={{ overflow: 'hidden', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '24px' }}>
            <table className="pdf-table" style={{ width: '100%' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#111827' }}>Catégorie</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#111827' }}>Montant</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#111827' }}>Pourcentage</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: '1px solid #e5e7eb' }}>
                {data.expenseCategories.map((category, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>{category.category}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#dc2626', textAlign: 'right' }}>{formatCurrency(category.amount)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', textAlign: 'right' }}>{category.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '32px' }} className="page-break-avoid">
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', margin: '0 0 16px 0' }}>Notes et recommandations</h3>
        <div style={{ fontSize: '14px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ margin: '0' }}>• Ce rapport présente une analyse complète de vos performances financières.</p>
          <p style={{ margin: '0' }}>• Les revenus incluent toutes les réservations confirmées pour la période.</p>
          <p style={{ margin: '0' }}>• Les dépenses comprennent les commissions Paris Janitor et les frais de service.</p>
          <p style={{ margin: '0' }}>• Pour optimiser vos revenus, consultez nos recommandations de tarification.</p>
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