import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Progress from '@/components/ui/Progress'
import Chart from '@/components/shared/Chart'
import { COLORS } from '@/constants/chart.constant'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useNavigate } from 'react-router-dom'
import { apiGetDashboardData } from '@/services/DashboardService'
import { useAppSelector } from '@/store'
import { ClipLoader } from 'react-spinners'


interface DashboardData {
  productCount: number
  productOverview: {
    assigned: number
    available: number
    total: number
    weeklyTrend: {
      series: Array<{ name: string; data: number[] }>
      categories: string[]
    }
  }
  recentAssignments?: Array<{
    id: string
    name: string
    assignedTo: string
    date: string
    status: string
  }>
  categoryStats?: Array<{
    name: string
    total: number
    assigned: number
    available: number
  }>
}

const ProductDashboard = () => {
  const navigate = useNavigate()
  const userName = useAppSelector((state) => state.auth.user?.username || 'Admin')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const data = await apiGetDashboardData()
        setDashboardData(data)
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to load dashboard data'
        setError(errorMessage)
        console.error('Dashboard Error:', err)
      
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <ClipLoader 
          color="#3b82f6"
          size={50}
          speedMultiplier={0.8}
        />
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">{error || 'Failed to load dashboard data'}</p>
      </div>
    )
  }

  // Destructure with safe defaults
  const {
    productCount = 0,
    productOverview = {
      assigned: 0,
      available: 0,
      total: 0,
      weeklyTrend: {
        series: [],
        categories: []
      }
    },
    recentAssignments = [],
    categoryStats = []
  } = dashboardData

  const {
    assigned = 0,
    available = 0,
    total = 0,
    weeklyTrend = {
      series: [],
      categories: []
    }
  } = productOverview

  return (
    <div className="flex flex-col gap-4 h-full p-4">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-1">Welcome back, {userName}!</h2>
        <p className="text-gray-600 dark:text-gray-300">
          You're managing {productCount} products in the system
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Product Overview Card */}
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Product Overview</h3>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold ">{assigned}</div>
                <div className="text-sm text-gray-500">Assigned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{available}</div>
                <div className="text-sm text-gray-500">Available</div>
              </div>
            </div>
          </div>
          <Chart
            series={weeklyTrend.series}
            xAxis={weeklyTrend.categories}
            height={300}
            type="bar"
            customOptions={{
              colors: [COLORS[0], COLORS[2]],
              legend: { show: true, position: 'top' },
            }}
          />
        </Card>

        {/* Category Stats */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Inventory by Category</h3>
          <div className="space-y-4">
            {categoryStats.map((category) => (
              <div key={category.name}>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{category.name}</span>
                  <span className="text-sm">
                    {category.assigned}/{category.total} assigned
                  </span>
                </div>
                <Progress
                  percent={Math.round((category.assigned / category.total) * 100)}
                  className="h-2"
                  color="blue-500"
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Assignments Card */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Recent Assignments</h3>
          <Button size="xs" onClick={() => navigate('/assignments')}>
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {recentAssignments.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-gray-500">Assigned to {item.assignedTo}</p>
              </div>
              <Badge className={item.status === 'assigned' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}>
                {item.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default ProductDashboard