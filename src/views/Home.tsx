import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Progress from '@/components/ui/Progress'
import Chart from '@/components/shared/Chart'
import { COLORS } from '@/constants/chart.constant'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useNavigate } from 'react-router-dom'
import { apiGetDashboardData, DashboardData } from '@/services/DashboardService'
import { ClipLoader } from 'react-spinners'

interface CurrentUser {
    username: string
    role: string
    name: string
    email: string
}

const ProductDashboard = () => {
    const navigate = useNavigate()
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

    // Get current user from localStorage on component mount
    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            try {
                setCurrentUser(JSON.parse(userData))
            } catch (error) {
                console.error('Error parsing user data:', error)
            }
        }
    }, [])

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

    const {
        summary,
        weeklyTrend,
        recentActivities,
        categoryDistribution
    } = dashboardData

    // Prepare chart data
    const chartData = {
        series: [{
            name: 'Assignments',
            data: weeklyTrend.map(day => day.assignments)
        }],
        categories: weeklyTrend.map(day => day.day)
    }

    return (
        <div className="flex flex-col gap-4 h-full p-4">
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-1">
                    Welcome back
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                    {/* You're managing {summary.products} products in the system */}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Product Overview Card */}
                <Card className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Product Overview</h3>
                        <div className="flex gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold">{summary.assigned}</div>
                                <div className="text-sm text-gray-500">Assigned</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">{summary.products - summary.assigned}</div>
                                <div className="text-sm text-gray-500">Available</div>
                            </div>
                        </div>
                    </div>
                    <Chart
                        series={chartData.series}
                        xAxis={chartData.categories}
                        height={300}
                        type="bar"
                        customOptions={{
                            colors: [COLORS[0]],
                            legend: { show: true, position: 'top' },
                        }}
                    />
                </Card>

                {/* Category Stats */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4">Inventory by Category</h3>
                    <div className="space-y-4">
                        {categoryDistribution.map((category) => (
                            <div key={category.name}>
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium">{category.name}</span>
                                    <span className="text-sm">
                                        {category._count.products} items
                                    </span>
                                </div>
                                <Progress
                                    percent={Math.round((category._count.products / summary.products) * 100)}
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
                    {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                            <div>
                                <h4 className="font-medium">{activity.product.name}</h4>
                                <p className="text-sm text-gray-500">
                                    Assigned to {activity.employee.name} • {activity.assignedAt}
                                </p>
                            </div>
                            <Badge className="bg-blue-500 text-white">
                                Assigned
                            </Badge>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}

export default ProductDashboard