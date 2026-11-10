import { getDashboardStats as loadDashboardStats } from '../services/adminService.js'

export async function getDashboardStats(request, response) {
  const stats = await loadDashboardStats()
  return response.json({ success: true, data: stats })
}
