import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, Key } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'register';
  onClose: () => void;
  onAuthSuccess: () => void;
}

export function AuthModal({ isOpen, mode, onClose, onAuthSuccess }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [codeTimer, setCodeTimer] = useState(0);

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setAuthMode(mode);
      setCodeSent(false);
      setCode('');
      setPassword('');
      setError(null);
      setMessage(null);
      setCodeTimer(0);
    }
  }, [isOpen, mode]);

  // 验证邮箱格式
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // 简单哈希（生产环境应该用更好的加密）
  const hashPassword = (pwd: string) => {
    // 简单实现：实际应该用 bcrypt 或 argon2
    return btoa(pwd + '_salting_wood');
  };

  // 发送验证码（用于注册/重置密码）
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
          shouldCreateUser: false,
        },
      });

      if (error) throw error;

      setCodeSent(true);
      setMessage('✅ 验证码已发送到邮箱，请输入 6 位数字验证码');

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

  // 处理注册/重置密码
  const handleRegister = async () => {
    if (!email || !validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    if (!password || password.length < 6) {
      setError('密码至少 6 位');
      return;
    }

    if (!code || code.length !== 6) {
      setError('请输入 6 位数字验证码');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 第一步：验证 OTP 验证码
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });

      if (verifyError) throw verifyError;

      // 第二步：将用户信息保存到业务表（包含密码）
      const hashedPassword = hashPassword(password);
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          email: email.toLowerCase(),
          password_hash: hashedPassword,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'email',
        });

      if (upsertError) throw upsertError;

      // 第三步：创建本地 session（不再调用 signInWithOtp，避免重新发送验证码）
      const loginData = {
        email: email.toLowerCase(),
        loggedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      localStorage.setItem('user_session', JSON.stringify(loginData));
      window.dispatchEvent(new CustomEvent('auth-change', { detail: loginData }));

      setMessage(authMode === 'register' ? '✅ 注册成功！' : '✅ 密码已重置！');
      setTimeout(() => {
        onAuthSuccess();
      }, 500);
    } catch (e: any) {
      setError(e.message || '操作失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理登录
  const handleLogin = async () => {
    if (!email || !validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    if (!password) {
      setError('请输入密码');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 第一步：从业务表查询用户，验证密码
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('email, password_hash')
        .eq('email', email.toLowerCase())
        .single();

      if (fetchError || !userData) {
        setError('该邮箱未注册，请先注册');
        return;
      }

      // 验证密码
      const hashedInput = hashPassword(password);
      if (userData.password_hash !== hashedInput) {
        setError('密码错误');
        return;
      }

      // 第二步：密码正确，使用 OTP 方式创建 session（不发送邮件）
      // 注意：这里会发送邮件，所以我们改用其他方式
      // 使用 Supabase Auth 的 signInWithOtp 会发送邮件，不太合适
      // 我们直接设置一个自定义的登录状态

      // 更好的方式：直接设置登录状态到 localStorage
      const loginData = {
        email: email.toLowerCase(),
        loggedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 天
      };
      localStorage.setItem('user_session', JSON.stringify(loginData));

      // 触发 auth 状态变化
      setUserSession(loginData);

      setMessage('✅ 登录成功！');
      setTimeout(() => {
        onAuthSuccess();
      }, 500);
    } catch (e: any) {
      setError(e.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 设置用户 session（自定义）
  const setUserSession = (sessionData: any) => {
    window.dispatchEvent(new CustomEvent('auth-change', { detail: sessionData }));
  };

  // 切换模式
  const switchMode = (newMode: 'login' | 'register') => {
    setAuthMode(newMode);
    setCodeSent(false);
    setCode('');
    setPassword('');
    setError(null);
    setMessage(null);
    setCodeTimer(0);
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
              <h2 className="text-xl font-semibold text-stone-800 font-serif">
                {authMode === 'login' ? '欢迎回来' : '注册新账号'}
              </h2>
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
                    disabled={codeSent && authMode === 'register'}
                  />
                </div>
              </div>

              {/* 密码输入 */}
              <div className="mb-4 space-y-2">
                <label className="text-sm font-medium text-stone-600">
                  登录密码
                  {authMode === 'register' && !codeSent && (
                    <span className="text-stone-400 font-normal ml-1">(至少 6 位)</span>
                  )}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-10 pr-4 py-3 text-stone-700 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-400/10 font-serif"
                  />
                </div>
              </div>

              {/* 验证码输入（注册模式） */}
              {authMode === 'register' && (
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
                  {codeSent && (
                    <p className="text-xs text-stone-500 mt-1">
                      提示：验证码已发送到邮箱
                    </p>
                  )}
                </div>
              )}

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
              {authMode === 'register' ? (
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={isLoading || !codeSent}
                  className="w-full rounded-xl bg-amber-500 px-6 py-3 font-medium text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 disabled:opacity-50 disabled:shadow-none"
                >
                  {isLoading ? '处理中...' : (codeSent ? '验证并注册' : '获取验证码注册')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full rounded-xl bg-amber-500 px-6 py-3 font-medium text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 disabled:opacity-50 disabled:shadow-none"
                >
                  {isLoading ? '登录中...' : '登录'}
                </button>
              )}

              {/* 切换模式 */}
              <div className="mt-4 text-center text-sm text-stone-500">
                {authMode === 'login' ? (
                  <>
                    还没有账号？{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="text-amber-600 font-medium hover:underline"
                    >
                      立即注册
                    </button>
                    <span className="mx-2">|</span>
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="text-amber-600 font-medium hover:underline"
                    >
                      忘记密码？
                    </button>
                  </>
                ) : (
                  <>
                    已有账号？{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="text-amber-600 font-medium hover:underline"
                    >
                      立即登录
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
