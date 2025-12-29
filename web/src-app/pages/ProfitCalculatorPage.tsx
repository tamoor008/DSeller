import { CalculatorModule } from '../modules/calculator'
import { AppColors } from '../constants/colors'

const ProfitCalculatorPage = () => {
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: AppColors.bgcolor,
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ 
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.2em',
          color: '#94a3b8',
          margin: 0
        }}>
          Daraz Seller Toolkit
        </p>
        <h1 style={{ 
          margin: '0.25rem 0',
          fontSize: '2rem',
          fontWeight: 700,
          color: AppColors.textPrimary
        }}>
          Daraz Profit Calculator
        </h1>
        <p style={{ 
          margin: '0.5rem 0 0',
          color: AppColors.textSecondary
        }}>
          Stress-test both FBM and FBD scenarios with smart presets, instant ROI, and category-specific
          commissions pulled straight from the Daraz sheet.
        </p>
      </div>
      <CalculatorModule />
    </div>
  )
}

export default ProfitCalculatorPage

