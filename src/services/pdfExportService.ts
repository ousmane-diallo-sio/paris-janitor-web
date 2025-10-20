import html2pdf from 'html2pdf.js'

export async function exportQuoteFromElement(element: HTMLElement, filename?: string): Promise<void> {
  try {
    const opt = {
      filename: filename || `devis-${Date.now()}.pdf`,
      image: { 
        type: 'jpeg' as const, 
        quality: 1 
      },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        backgroundColor: '#ffffff',
        height: element.scrollHeight,
        width: element.scrollWidth
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' as const,
        compress: true
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.page-break-before',
        after: '.page-break-after',
        avoid: '.page-break-avoid'
      }
    }

    await html2pdf().set(opt).from(element).save()
    return Promise.resolve()
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Échec de la génération du PDF. Veuillez réessayer.')
  }
}