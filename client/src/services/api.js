import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
})

export function getErrorMessage(error) {
  return error.response?.data?.message || error.message || 'The request could not be completed.'
}

export function getImageUrl(imagePath) {
  if (!imagePath) return ''
  if (/^https?:\/\//i.test(imagePath)) return imagePath
  const apiOrigin = new URL(api.defaults.baseURL).origin
  return `${apiOrigin}${imagePath}`
}

export default api
