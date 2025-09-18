// request.ts
import axios from 'axios'

const request = axios.create({
  baseURL: 'https://projectback-jssa.onrender.com', 
  timeout: 50000, 
})


export default request
