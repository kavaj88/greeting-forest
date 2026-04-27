import React, { useState, useEffect, useCallback } from 'react';
import { X, Send, Trash2, Edit, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Wish, Comment } from '../types';
import { fetchComments, createComment } from '../../lib/api';

const categoryLabel: Record<string, { zh: string; en: string; classes: string }> = {
  blessing: { zh: '祈福', en: 'Blessing', classes: 'bg-red-100 text-red-700' },
  wish: { zh: '祝愿', en: 'Wish', classes: 'bg-amber-100 text-amber-700' },
  vent: { zh: '吐槽', en: 'Vent', classes: 'bg-slate-100 text-slate-700' },
};

interface WishDetailPanelProps {
  wish: Wish | null;
  onClose: () => void;
  user: { email: string; loggedAt: string; expiresAt: string } | null;
  isAdmin?: boolean;
  onDelete?: () => void;
  onReasonEdit?: () => void;
  reasonEditable?: boolean;
  thankedContent?: string | null;
  thankedAt?: number | null;
  onThankOpen?: () => void;
}

interface CommentItemProps {
  comment: Comment;
  depth: number;
  replyToId: string | null;
  replyContent: string;
  onReply: (id: string) => void;
  onReplyContentChange: (val: string) => void;
  onSubmitReply: () => void;
  user: WishDetailPanelProps['user'];
}

const CommentItem = ({ comment, depth, replyToId, replyContent, onReply, onReplyContentChange, onSubmitReply }: CommentItemProps) => {
  const isReplying = replyToId === comment.id;
  const dateStr = new Date(comment.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="relative flex flex-col gap-2" style={{ marginLeft: depth * 12 }}>
      {depth > 0 && (
        <div className="absolute -left-0 top-0 h-full w-px bg-stone-200" />
      )}
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium text-stone-400">{comment.author}</span>
        <span className="text-[10px] text-stone-400">{dateStr}</span>
      </div>
      <p className="text-sm text-stone-600 leading-relaxed font-serif">{comment.content}</p>
      {!isReplying && (
        <button
          onClick={() => onReply(comment.id)}
          className="self-start text-xs text-stone-400 hover:text-amber-600 transition-colors"
        >
          回复 · Reply
        </button>
      )}
      <AnimatePresence>
        {isReplying && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 overflow-hidden"
          >
            <input
              type="text"
              value={replyContent}
              onChange={(e) => onReplyContentChange(e.target.value)}
              placeholder="写下你的回复..."
              className="flex-1 rounded-full border border-stone-200 bg-white/60 px-3 py-1.5 text-sm outline-none focus:border-amber-400 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && replyContent.trim()) {
                  onSubmitReply();
                }
              }}
            />
            <button
              onClick={() => onReply('')}
              className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
            >
              <X size={12} />
            </button>
            <button
              onClick={onSubmitReply}
              disabled={!replyContent.trim()}
              className="rounded-full bg-amber-500 p-1.5 text-white disabled:opacity-30 hover:bg-amber-600 transition-colors"
            >
              <Send size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const WishDetailPanel = ({ wish, onClose, user, isAdmin, onDelete, onReasonEdit, reasonEditable, thankedContent, thankedAt, onThankOpen }: WishDetailPanelProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newContent, setNewContent] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);

  // 拉取评论
  useEffect(() => {
    if (!wish) return;
    setIsCommentsLoading(true);
    fetchComments(wish.id).then((res) => {
      if (res.success && res.data) {
        setComments(res.data);
      }
      setIsCommentsLoading(false);
    });
  }, [wish]);

  // 提交评论
  const handleSubmitComment = useCallback(async (content: string, parentId?: string) => {
    if (!wish || !content.trim() || !user) return;
    setIsLoading(true);
    const result = await createComment({
      wishId: wish.id,
      author: user.email.split('@')[0],
      content: content.trim(),
      parentId,
    });
    if (result.success && result.data) {
      setComments((prev) => [...prev, result.data!]);
    }
    setIsLoading(false);
  }, [wish, user]);

  const handleSubmitNewComment = () => {
    if (!newContent.trim()) return;
    handleSubmitComment(newContent);
    setNewContent('');
  };

  const handleSubmitReply = () => {
    if (!replyContent.trim() || !replyToId) return;
    handleSubmitComment(replyContent, replyToId);
    setReplyToId(null);
    setReplyContent('');
  };

  const handleReply = useCallback((id: string) => {
    setReplyToId((prev) => {
      if (prev === id) return null;
      return id;
    });
    setReplyContent('');
  }, []);

  // 递归渲染评论树
  const renderCommentTree = useCallback(
    (comment: Comment, depth: number): React.ReactNode => {
      const childReplies = comments
        .filter((c) => c.parentId === comment.id)
        .sort((a, b) => a.createdAt - b.createdAt);

      return (
        <React.Fragment key={comment.id}>
          <CommentItem
            comment={comment}
            depth={depth}
            replyToId={replyToId}
            replyContent={replyContent}
            onReply={handleReply}
            onReplyContentChange={setReplyContent}
            onSubmitReply={handleSubmitReply}
            user={user}
          />
          {childReplies.map((r) => renderCommentTree(r, depth + 1))}
        </React.Fragment>
      );
    },
    [comments, replyToId, replyContent, handleReply, handleSubmitReply, user]
  );

  // 点击空白处关闭回复框
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (replyToId) {
        setReplyToId(null);
        setReplyContent('');
      } else {
        onClose();
      }
    }
  };

  // ESC 键关闭回复框
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && replyToId) {
        setReplyToId(null);
        setReplyContent('');
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [replyToId]);

  const cat = categoryLabel[wish?.category || 'wish'];
  const dateStr = wish
    ? new Date(wish.createdAt).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      })
    : '';

  if (!wish) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* 背景遮罩 */}
        <motion.div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
        />

        {/* 面板 */}
        <motion.div
          className="relative flex h-full w-full flex-col overflow-hidden border-l border-stone-200/50 bg-white/95 shadow-2xl sm:max-w-[25%]"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-stone-200/50 px-4 py-3">
            <h2 className="text-sm font-bold text-stone-800 font-serif">
              心愿详情
              <span className="ml-2 text-[10px] font-normal text-stone-400 uppercase tracking-widest">
                Wish Details
              </span>
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
            {/* 心愿详情 */}
            <div className="mb-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className={twMerge('rounded-full px-3 py-0.5 text-[10px] font-medium', cat.classes)}>
                  {cat.zh} · {cat.en}
                </span>
                {isAdmin && onDelete && (
                  <button
                    onClick={onDelete}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={12} />
                    删除
                  </button>
                )}
              </div>
              <div className="rounded-lg bg-stone-50 p-4 border border-stone-100">
                <p className="text-sm text-stone-700 leading-relaxed font-serif whitespace-pre-wrap">
                  {wish.content}
                </p>
                {wish.reason && (
                  <>
                    <div className="my-3 border-t border-stone-200/50" />
                    <div className="mt-3 flex items-start justify-between gap-2">
                      <p className="text-sm text-stone-600 leading-relaxed font-serif whitespace-pre-wrap flex-1">
                        {wish.reason}
                      </p>
                      {reasonEditable && (
                        <button
                          onClick={onReasonEdit}
                          className="flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] text-stone-400 hover:bg-stone-200 hover:text-stone-600 transition-colors"
                        >
                          <Edit size={10} />
                          编辑
                        </button>
                      )}
                    </div>
                  </>
                )}
                {!wish.reason && reasonEditable && (
                  <div className="mt-3 pt-3 border-t border-stone-200/50">
                    <button
                      onClick={onReasonEdit}
                      className="flex items-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-3 py-2 text-xs text-stone-400 hover:border-amber-400 hover:text-amber-600 transition-colors"
                    >
                      <Edit size={12} />
                      添加发愿缘由 · Add Reason
                    </button>
                  </div>
                )}

                {/* 谢愿词模块 */}
                {isAdmin && (
                  <div className="mt-3 pt-3 border-t border-stone-200/50">
                    {thankedContent ? (
                      <div>
                        <div className="flex items-center gap-1 text-xs text-green-600 mb-2">
                          <CheckCircle size={12} /> 已还愿
                          <span className="text-[10px] text-stone-400 ml-1">· Fulfilled</span>
                        </div>
                        <div className="rounded-lg bg-green-50/50 p-3 border border-green-100">
                          <p className="text-xs text-stone-600 leading-relaxed font-serif whitespace-pre-wrap">
                            {thankedContent}
                          </p>
                          {thankedAt && (
                            <p className="text-[10px] text-stone-400 mt-1">
                              {new Date(thankedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' })} 还愿
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={onThankOpen}
                        className="text-xs text-amber-600 hover:text-amber-700 transition-colors"
                      >
                        去还原 · Fulfill
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>— {wish.author || '匿名'}</span>
                <span>{dateStr}</span>
              </div>
            </div>

            {/* 分割线 */}
            <div className="my-4 border-t border-stone-200/50" />

            {/* 留言区 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-stone-800">
                留言
                <span className="ml-2 text-[10px] font-normal text-stone-400 uppercase tracking-widest">
                  Comments
                </span>
              </h3>

              {isCommentsLoading ? (
                <div className="py-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-amber-500 border-t-transparent"></div>
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-xs text-stone-400 py-4">
                  暂无留言，来做第一个评论的人吧！
                  <br />
                  <span className="text-[10px]">No comments yet. Be the first!</span>
                </p>
              ) : (
                (() => {
                  const topComments = comments
                    .filter((c) => c.parentId === null)
                    .sort((a, b) => b.createdAt - a.createdAt);
                  return topComments.map((c) => renderCommentTree(c, 0));
                })()
              )}
            </div>
          </div>

          {/* 底部输入栏 */}
          <div className="shrink-0 border-t border-stone-200/50 p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="有何感想，说点什么？"
                className="flex-1 rounded-full border border-stone-200 bg-white/60 px-4 py-2 text-sm outline-none focus:border-amber-400 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newContent.trim()) {
                    handleSubmitNewComment();
                  }
                }}
              />
              <button
                onClick={handleSubmitNewComment}
                disabled={!newContent.trim() || isLoading}
                className="rounded-full bg-amber-500 px-4 py-2 text-xs font-medium text-white shadow-md shadow-amber-500/20 disabled:opacity-30 hover:bg-amber-600 transition-colors"
              >
                <span className="flex items-center gap-1">
                  <Send size={12} />
                  发送
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
