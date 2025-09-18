import React, { useState, useCallback, useEffect } from "react";
import _ from "lodash";
import styles from "./Debounce.module.css";
import request from "../utils/request";

type SearchResult = {
  item: string;
  score: number;
  matches: number[];
};

const FuzzySearch: React.FC<{ path: string; name: string }> = ({ path, name }) => {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    if (path == "/users/search") {
      const fetchFriends = async () => {
        const {
          data: { users },
        } = await request.get("/users/search");
        const filters = users.filter((i: { user: string }) =>{
            if(i.user !==name){
                return i.user
            }
        })
        setItems(filters.map((i:{user:string}) => i.user));
      };
      fetchFriends();
    } else if (path == "/messages/getMessages") {
      const fetchItems = async () => {
        const {
          data: { messages },
        } = await request.get(path);
        setItems(messages.map((i: { text: string }) => i.text));
      };
      fetchItems();
    }
  }, [path]);
  
  

  // 执行搜索
  const doSearch = useCallback((rawQuery: string) => {
    const q = rawQuery.trim();
    if (!q) {
      setResults([]);
      return;
    }

    // 计算每个 item 的得分并排序
    const scored: SearchResult[] = items
      .map((item) => {
        const { score, matches } = fuzzyScore(q, item);
        return { item, score, matches };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setResults(scored);
  }, [items]);

  // 使用 lodash 的 debounce 包裹搜索函数
  const debouncedSearch = useCallback(_.debounce(doSearch, 300), [doSearch]);

  // 输入框变化事件
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    debouncedSearch(val);
  };

  // 简单的模糊匹配打分函数
  function fuzzyScore(
    query: string,
    text: string
  ): { score: number; matches: number[] } {
    query = query.toLowerCase();
    text = text.toLowerCase();
    if (!query) return { score: 0, matches: [] };

    let qi = 0;
    const matches: number[] = [];
    // 遍历 text 按顺序查找 query 中的每个字符
    for (let ti = 0; ti < text.length && qi < query.length; ti++) {
      if (text[ti] === query[qi]) {
        matches.push(ti);
        qi++;
      }
    }

    // 如果没能完全匹配，返回 0 分
    if (qi !== query.length) {
      return { score: 0, matches: [] };
    }

    // 打分逻辑：匹配字符数越多越好，跨度越小越好，起始位置越靠前越好
    const matchCount = matches.length;
    const span = matches[matches.length - 1] - matches[0] + 1;
    const score = matchCount * 100 - span * 3 - matches[0] * 1.5;
    return { score, matches };
  }

  // 高亮匹配字符
  function highlightText(text: string, matches: number[]): string {
    if (!matches || matches.length === 0) return escapeHtml(text);
    let out = "";
    let last = 0;
    for (const idx of matches) {
      out += escapeHtml(text.slice(last, idx));
      out += `<span class="highlight">${escapeHtml(text[idx])}</span>`;
      last = idx + 1;
    }
    out += escapeHtml(text.slice(last));
    return out;
  }

  // 防止 HTML 注入
  function escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  return (
    <div className={styles["search-wrap"]}>
      <input
        className={styles["search-input"]}
        type="search"
        placeholder="搜索"
        value={query}
        onChange={handleChange}
        aria-label="搜索"
      />

      {query && (
        <div className={styles["results"]} role="listbox">
          {results.length > 0 ? (
            results.map((s) => (
              <div
                key={s.item}
                className={styles["item"]}
                role="option"
                onClick={() => setQuery(s.item)}
              >
                <div
                  className={styles["title-text"]}
                  dangerouslySetInnerHTML={{
                    __html: highlightText(s.item, s.matches),
                  }}
                />
              </div>
            ))
          ) : (
            <div className={styles["empty"]}>没有找到匹配项</div>
          )}
        </div>
      )}
    </div>
  );
};

export default FuzzySearch;
