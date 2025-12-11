import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { AppColors } from '../constants/colors'
import { AppStrings } from '../constants/strings'

const WeeklyReportPage = () => {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: AppColors.bgcolor,
      padding: '16px'
    }}>
      <Header title={AppStrings.weeklyReport} goBack={() => navigate(-1)} />
      <div style={{
        backgroundColor: AppColors.card,
        borderRadius: '8px',
        padding: '2rem',
        marginTop: '16px',
        textAlign: 'center'
      }}>
        <p style={{ color: AppColors.textSecondary }}>
          Weekly report feature coming soon
        </p>
      </div>
    </div>
  )
}

export default WeeklyReportPage



