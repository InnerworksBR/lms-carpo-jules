import axios from 'axios'
import Cookies from 'js-cookie'

export const api = axios.create({
  baseURL: 'http://localhost:3333'
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('lms-token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
