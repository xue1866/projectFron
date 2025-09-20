import { useEffect, useRef, useState } from "react";
import type { IFriend, IMessage } from "../types";
import FuzzySearch from "../components/Debounce";
import request from "../utils/request";

function Index() {
  const ws = useRef<WebSocket | null>(null);
  const [list, setList] = useState<IMessage[]>([]);
  const senderId = useRef(JSON.parse(sessionStorage.getItem("sender") || '""')).current;
  const [receiverIds, setReceiverIds] = useState(""); // 接收人
  const receiverId = useRef<string>(receiverIds);
  const [form, setForm] = useState({ text: "", sender: "", receiver: "" });
  const name = useRef(JSON.parse(sessionStorage.getItem("name") || '""') || "");
  const [friend, setFriend] = useState<IFriend[]>([]);
  const [receiverName, setReceiverName] = useState("");
  const buttonRef = useRef<HTMLDivElement>(null);

  // 获取好友列表
  const getFriend = async () => {
    const {
      data: { code, friends },
    } = await request.get("/friends/getFriends", { params: { sender: senderId } });
    if (code === 200) setFriend(friends);
  };

  // 同步 receiverId 的 ref
  useEffect(() => {
    receiverId.current = receiverIds;
  }, [receiverIds]);

  // 滚动到底部
  useEffect(() => {
    buttonRef.current?.scrollIntoView({ behavior: "auto" });
  }, [list]);

  // WebSocket 连接
  const WebSockets = () => {
    if (ws.current) return;
    ws.current = new WebSocket("wss://projectback-jssa.onrender.com/ws?user=" + senderId);

    ws.current.onopen = () => console.log("连接成功");
    ws.current.onerror = () => console.log("连接失败");

    ws.current.onmessage = (event) => {
      const value = JSON.parse(event.data);
      if (
        (value.sender.toString() === senderId && value.receiver.toString() === receiverId.current) ||
        (value.sender.toString() === receiverId.current && value.receiver.toString() === senderId)
      ) {
        setList((prev) => {
          if (prev.some((item) => item._id === value._id)) return prev;
          return [...prev, value];
        });
      }
    };
  };

  // 初始加载
  useEffect(() => {
    WebSockets();
    getFriend();

    const receiverIdSession = sessionStorage.getItem("receiverId");
    const receiverNameSession = sessionStorage.getItem("receiverName");
    if (receiverIdSession && receiverNameSession) {
      setReceiverIds(receiverIdSession);
      setReceiverName(receiverNameSession);
      fetchMessages(receiverIdSession);
    }
  }, []);

  // 获取聊天记录
  const fetchMessages = async (receiver: string) => {
    const {
      data: { messages, code },
    } = await request.get("/messages/getMessages", { params: { sender: senderId, receiver } });
    if (code === 200) {
      setList((prev) => {
        const newMessages = messages.filter((m: IMessage) => !prev.some((p) => p._id === m._id));
        return [...prev, ...newMessages];
      });
    }
  };

  // 发送消息
  const save = () => {
    if (!form.text.trim()) return;
    ws.current?.send(JSON.stringify({ text: form.text, sender: senderId, receiver: receiverId.current }));
    setForm({ ...form, text: "" });
  };

  // 点击好友获取聊天记录
  const DetailedLover = async (i: IFriend) => {
    setReceiverIds(i._id.toString());
    setReceiverName(i.user);
    sessionStorage.setItem("receiverId", i._id.toString());
    sessionStorage.setItem("receiverName", i.user);
    fetchMessages(i._id.toString());
  };

  // 🔹 前端轮询：定时拉取最新消息
  useEffect(() => {
    if (!receiverIds) return;
    const interval = setInterval(() => {
      fetchMessages(receiverId.current);
    }, 5000); // 每 5 秒拉取一次
    return () => clearInterval(interval);
  }, [receiverIds]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex" }}>
        {/* 好友列表 */}
        <div>
          <h2>好友</h2>
          {friend.map((i) => (
            <div
              key={i._id}
              style={{ border: "1px solid #ccc", padding: 10, cursor: "pointer" }}
              onClick={() => DetailedLover(i)}
            >
              姓名：{i.user}
              <br />
              电话：{i.phone}
            </div>
          ))}
        </div>

        {/* 聊天窗口 */}
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
            {list.map((i) => (
              <div key={i._id}>
                {i.sender === senderId ? (
                  <p style={{ textAlign: "right" }}>{i.text}: {name.current}</p>
                ) : (
                  <p style={{ textAlign: "left" }}>{receiverName}: {i.text}</p>
                )}
              </div>
            ))}
            <div ref={buttonRef}></div>
          </div>
          <input
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          <button onClick={save}>发送</button>
        </div>

        {/* 模糊搜索 */}
        <div>
          <h2>模糊搜索联系人</h2>
          <FuzzySearch path={"/users/search"} name={name.current} />
        </div>
      </div>
    </div>
  );
}

export default Index;
