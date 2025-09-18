
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import request from "../utils/request";


export default function Login() {
  let [form,setForm] = useState({user:'',pwd:''})
  let navigate = useNavigate()

    let login =async ()=>{
      console.log(form);
      
      let {data:{code,user}} = await request.get('/users/login',{params:form})
        console.log("user,code:",user,code)
      
      if(code===200){
        console.log(user)
        
        sessionStorage.setItem('sender',JSON.stringify(user._id))
        sessionStorage.setItem('name',JSON.stringify(user.user))
        navigate('/index')
      }
    }

  return (
    <>
        <div>
            <h2>登录</h2>
            <p>账号<input type="text" onChange={e=>setForm({...form,user:e.target.value})}/></p>
            <p>密码<input type="text" onChange={e=>setForm({...form,pwd:e.target.value})}/></p>
            <p><button onClick={login}>登录</button></p>
        </div>
    </>
  )
}
