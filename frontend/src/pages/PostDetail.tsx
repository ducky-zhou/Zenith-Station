import { Bookmark, Bot, MessageCircle, ThumbsUp } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";
import remarkGfm from "remark-gfm";

import { api } from "../api/client";
import { useAuth } from "../auth";
import { StatusMessage } from "../components/StatusMessage";
import type { Comment, Post } from "../types";

export function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiSummaryMeta, setAiSummaryMeta] = useState("");
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    if (!id) return;
    Promise.all([api.post(id), api.comments(id)])
      .then(([postData, commentData]) => {
        setPost(postData);
        setComments(commentData);
      })
      .catch((err: Error) => setError(err.message));
    if (user) {
      api.likeStatus(id)
        .then((status) => {
          setLiked(status.liked);
          setFavorited(status.favorited);
        })
        .catch(() => undefined);
    }
  };

  useEffect(() => {
    api.track("page_view", `/posts/${id}`);
    load();
  }, [id, user?.id]);

  useEffect(() => {
    if (!post) return;
    setAiSummary("");
    setAiSummaryError("");
    setAiSummaryMeta("");
    setAiSummaryLoading(true);
    api.postAiSummary(post.id)
      .then((data) => {
        setAiSummary(data.text);
        setAiSummaryMeta(`${data.provider} · ${data.model}`);
      })
      .catch((err: Error) => setAiSummaryError(err.message))
      .finally(() => setAiSummaryLoading(false));
  }, [post?.id, post?.updated_at]);

  const toggleLike = async () => {
    if (!id || !user) return;
    liked ? await api.unlike(id) : await api.like(id);
    setLiked(!liked);
    load();
  };

  const toggleFavorite = async () => {
    if (!id || !user) return;
    favorited ? await api.unfavorite(id) : await api.favorite(id);
    setFavorited(!favorited);
  };

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !commentText.trim()) return;
    await api.addComment(id, commentText.trim());
    setCommentText("");
    load();
  };

  if (error) return <StatusMessage tone="error" message={error} />;
  if (!post) return <StatusMessage message="加载中..." />;

  return (
    <article className="page-stack readable">
      <header className="article-header">
        <h1>{post.title}</h1>
        <p>{post.summary}</p>
        <div className="post-meta">
          <span>{new Date(post.created_at).toLocaleString()}</span>
          <span>
            <ThumbsUp aria-hidden="true" /> {post.likes_count}
          </span>
          <span>
            <Bookmark aria-hidden="true" /> {post.favorites_count}
          </span>
          <span>
            <MessageCircle aria-hidden="true" /> {post.comments_count}
          </span>
        </div>
      </header>
      <div className="article-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>
      <section className="ai-summary-panel">
        <div className="ai-summary-head">
          <span>
            <Bot aria-hidden="true" /> AI 摘要
          </span>
          {aiSummaryMeta && <small>{aiSummaryMeta}</small>}
        </div>
        {aiSummaryLoading ? (
          <p>DeepSeek 正在整理这篇文章...</p>
        ) : aiSummary ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiSummary}</ReactMarkdown>
        ) : (
          <p>{aiSummaryError ? `暂时无法生成摘要：${aiSummaryError}` : "暂无 AI 摘要。"}</p>
        )}
      </section>
      <div className="interaction-bar">
        <button onClick={toggleLike} disabled={!user} className={liked ? "active" : ""} type="button">
          <ThumbsUp aria-hidden="true" /> {liked ? "已赞" : "点赞"}
        </button>
        <button onClick={toggleFavorite} disabled={!user} className={favorited ? "active" : ""} type="button">
          <Bookmark aria-hidden="true" /> {favorited ? "已收藏" : "收藏"}
        </button>
      </div>
      <section className="comments">
        <h2>评论</h2>
        {user ? (
          <form onSubmit={submitComment} className="comment-form">
            <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={1000} />
            <button type="submit">发布</button>
          </form>
        ) : (
          <StatusMessage message="登录后可以评论、点赞和收藏。" />
        )}
        <div className="comment-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <strong>{comment.user.username}</strong>
              <span>{new Date(comment.created_at).toLocaleString()}</span>
              <p>{comment.content}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
