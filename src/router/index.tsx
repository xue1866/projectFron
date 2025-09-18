import { createBrowserRouter, Navigate } from 'react-router-dom'
import Index from '../pages/Index'
import Login from '../pages/Login'


// 路由守卫函数
function Guard({ children }: { children: React.ReactNode }) {
    const sender = sessionStorage.getItem('sender')
    if (sender) {
      return children
    }
    return <Navigate to="/login" replace />
  }
const routes = createBrowserRouter([
    {
        path:'/index',
        element:<Guard><Index/></Guard> 
    },
    {
        path:'/login',
        element:<Login/>
    },
    {
        path:'/',
        element:<Navigate to="/index" replace/>
    }
])



export default routes