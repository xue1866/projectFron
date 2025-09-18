//消息接口
export interface IMessage{
  text:string,
  sender:string,
  receiver:string,
  time:Date,
  _id:string
}

//好友接口
export interface IFriend{
  user:string,
  _id:string,
  phone:string
}
