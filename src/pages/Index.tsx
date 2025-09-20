import { useEffect, useRef, useState } from "react";
import type { IFriend, IMessage } from "../types";
import FuzzySearch from "../components/Debounce";
import request from "../utils/request";

function Index() {
  let ws = useRef<WebSocket | null>(null);
  let [list, setList] = useState<IMessage[]>([]);
  // 🔹 只在第一次渲染获取 senderId
  const senderId = useRef(
    JSON.parse(sessionStorage.getItem("sender") || '""')
  ).current;
  let [receiverIds, setReceiverIds] = useState(""); //接收人
  let receiverId = useRef<string>(receiverIds); //接收人
  let [form, setForm] = useState({
    text: "",
    sender: "",
    receiver: "",
  });
  let name = useRef(JSON.parse(sessionStorage.getItem("name") || '""') || ""); //获取本人的名称
  let [friend, setFriend] = useState<IFriend[]>([]); //好友列表
  let [receiverName, setReceiverName] = useState("");
  // 🔹 滚动到最底部的 ref
  const buttonRef = useRef<HTMLDivElement>(null);
  //获取好友列表
  let getFriend = async () => {
    let {
      data: { code, friends },
    } = await request.get("/friends/getFriends", {
      params: { sender: senderId },
    });
    if (code === 200) {
      setFriend(friends);
    }
  };

  //实时监听好友列表
  //监听接收人的变化
  useEffect(() => {
    receiverId.current = receiverIds;
  }, [receiverIds]);

  useEffect(() => {
    // 🔹 滚动到最底部
    buttonRef.current?.scrollIntoView({ behavior: "auto" });
  }, [list]);

  // 连接
  let WebSockets = () => {
    if (ws.current) return;
    ws.current = new WebSocket("wss://projectback-jssa.onrender.com/?user=" + senderId);

    ws.current.onopen = () => {
      console.log("连接成功");
    };
    ws.current.onerror = () => {
      console.log("连接失败");
    };

    // 接收
    ws.current.onmessage = (event) => {
      let value = JSON.parse(event.data);

      if (
        (value.sender.toString() == senderId &&
          value.receiver.toString() == receiverId.current) ||
        (value.sender.toString() == receiverId.current &&
          value.receiver.toString() == senderId)
      ) {
        setList((prev) => {
          // 如果已有相同 _id，就不添加
          if (prev.some((item) => item._id === value._id)) {
            return prev;
          }
          return [...prev, value];
        });
      }
    };
  };
  useEffect(() => {
    WebSockets();
    getFriend();

    //判断是否为刷新获取刷新前的数据
    let receiverId = sessionStorage.getItem("receiverId");
    let receiverName = sessionStorage.getItem("receiverName");
    if (receiverId && receiverName) {
      setReceiverIds(receiverId);
      setReceiverName(receiverName);
      async function DetailedLover() {
        let {
          data: { messages, code },
        } = await request.get("/messages/getMessages", {
          params: { sender: senderId, receiver: receiverId },
        });
        if (code === 200) {
          setList(messages);
        }
      }
      DetailedLover();
    }
  }, []);

  // 发送
  let save = () => {
    if (form.text.trim() == "") return;
    // 向服务器发送请求
    ws.current?.send(
      JSON.stringify({
        text: form.text,
        sender: senderId,
        receiver: receiverId.current,
      })
    );
    setForm({ ...form, text: "" });
  };

  //点击获取详情的聊天记录
  let DetailedLover = async (i: IFriend) => {
    setReceiverIds(i._id.toString());
    setReceiverName(i.user);
    sessionStorage.setItem("receiverId", i._id.toString());
    sessionStorage.setItem("receiverName", i.user);
    let {
      data: { messages, code },
    } = await request.get("/messages/getMessages", {
      params: { sender: senderId, receiver: i._id.toString() },
    });
    if (code === 200) {
      setList(messages);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex" }}>
        <div>
          <h2>好友</h2>
          {friend.map((i) => {
            return (
              <div
                key={i._id}
                style={{ border: "1px solid #ccc", padding: 10 }}
                onClick={() => DetailedLover(i)}
              >
                姓名：{i.user}
                <br />
                电话：{i.phone}
              </div>
            );
          })}
        </div>
        <div>
          <div
            style={{
              border: "1px solid #ccc",
              padding: 10,
              height: 200,
              overflowY: "auto",
              marginBottom: 10,
              width: 800,
            }}
          >
            {list.map((i) => {
              return (
                <div key={i._id}>
                  {i.sender == senderId ? (
                    <p style={{ textAlign: "right" }}>
                      {i.text}:{name.current}
                    </p>
                  ) : (
                    <p style={{ textAlign: "left" }}>
                      {receiverName}:{i.text}
                    </p>
                  )}
                </div>
              );
            })}
            <div ref={buttonRef}></div>
          </div>
          <input
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            value={form.text}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                save();
              }
            }}
          />
          <button onClick={save}>发送</button>
        </div>
        <div>
          <h2>模糊搜索联系人</h2>
          <FuzzySearch path={"/users/search"} name={name.current} />
        </div>
      </div>
    </div>
  );
}

export default Index;
