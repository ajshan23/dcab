import ApiService from './ApiService'
import { formatDistanceToNow } from 'date-fns'

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
  recentActivity?: Array<{
    id: string
    action: string
    timestamp: string
  }>
}

export const apiGetDashboardData = async (): Promise<DashboardData> => {
  try {
    const response = await ApiService.fetchData<{ 
      success: boolean
      data?: DashboardData
      message?: string
    }>({
      url: '/dashboard/products',
      method: 'get'
    })

    // Validate response structure
    if (!response.data?.success || !response.data.data) {
      throw new Error(response.data?.message || 'Invalid dashboard data format')
    }

    // Safely handle all array properties
    const baseData = response.data.data
    const recentActivity = baseData.recentActivity || []
    const recentAssignments = baseData.recentAssignments || []
    const categoryStats = baseData.categoryStats || []
    const weeklyTrendSeries = baseData.productOverview.weeklyTrend.series || []
    const weeklyTrendCategories = baseData.productOverview.weeklyTrend.categories || []

    return {
      ...baseData,
      productOverview: {
        ...baseData.productOverview,
        weeklyTrend: {
          series: weeklyTrendSeries,
          categories: weeklyTrendCategories
        }
      },
      recentActivity: recentActivity.map(activity => ({
        ...activity,
        timestamp: formatDistanceToNow(new Date(activity.timestamp)) + ' ago'
      })),
      recentAssignments,
      categoryStats
    }
  } catch (error: any) {
    console.error('DashboardService Error:', error)
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to fetch dashboard data'
    )
  }
}