import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Key } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'register';
  onClose: () => void;
  onAuthSuccess: () => void;
}

export function AuthModal({ isOpen, mode, onClose, onAuthSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [codeTimer, setCodeTimer] = useState(0);

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setCodeSent(false);
      setCode('');
      setError(null);
      setMessage(null);
      setCodeTimer(0);
    }
  }, [isOpen]);

  // 验证邮箱格式
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // 发送验证码
  const sendCode = async () => {
    if (!email || !validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true, // 新用户自动创建
        },
      });

      if (error) throw error;

      setCodeSent(true);
      setMessage('✅ 验证码已发送到邮箱，请输入 6 位数字验证码');

      // 启动倒计时
      let time = 60;
      setCodeTimer(time);
      const interval = setInterval(() => {
        time--;
        setCodeTimer(time);
        if (time <= 0) clearInterval(interval);
      }, 1000);
    } catch (e: any) {
      setError(e.message || '发送失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 验证并登录
  const handleVerifyAndLogin = async () => {
    if (!code || code.length !== 6) {
      setError('请输入 6 位数字验证码');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });

      if (error) throw error;

      // 登录成功
      setMessage('✅ 登录成功！');
      setTimeout(() => {
        onAuthSuccess();
      }, 500);
    } catch (e: any) {
      setError(e.message || '验证失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-md my-8 overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-stone-100 p-5 pb-4">
              <h2 className="text-xl font-semibold text-stone-800 font-serif">如是愿，如是成</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* 邮箱输入 */}
              <div className="mb-4 space-y-2">
                <label className="text-sm font-medium text-stone-600">邮箱账号</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-10 pr-4 py-3 text-stone-700 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-400/10 font-serif"
                    disabled={codeSent}
                  />
                </div>
              </div>

              {/* 验证码输入 */}
              <div className="mb-4 space-y-2">
                <label className="text-sm font-medium text-stone-600">验证码</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6 位数字验证码"
                      maxLength={6}
                      disabled={!codeSent}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-10 pr-4 py-3 text-stone-700 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-400/10 font-serif"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={codeSent && codeTimer > 0}
                    className={twMerge(
                      'px-4 py-2 rounded-xl font-medium text-white transition-all whitespace-nowrap',
                      codeSent && codeTimer > 0
                        ? 'bg-stone-300 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-600'
                    )}
                  >
                    {codeSent && codeTimer > 0 ? `${codeTimer}秒` : '获取验证码'}
                  </button>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  验证码将发送到您的邮箱，新用户自动注册
                </p>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              {/* 成功提示 */}
              {message && (
                <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-600 text-sm text-center">
                  {message}
                </div>
              )}

              {/* 提交按钮 */}
              <button
                type="button"
                onClick={handleVerifyAndLogin}
                disabled={!codeSent || isLoading || codeTimer > 0 || !code}
                className="w-full rounded-xl bg-amber-500 px-6 py-3 font-medium text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 disabled:opacity-50 disabled:shadow-none"
              >
                {isLoading ? '验证中...' : '登录/注册'}
              </button>

              {/* 提示信息 */}
              <div className="mt-4 text-center text-sm text-stone-500">
                <p>使用邮箱验证码登录，安全便捷</p>
                <p className="text-xs mt-1">无需设置密码，验证码即密码</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
