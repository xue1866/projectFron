// request.ts
import axios from 'axios'

const request = axios.create({
  baseURL: 'http://localhost:3000', 
  timeout: 50000, 
})


export default request
