'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBanner } from '@/components/StatusBanner';
import { API_BASE_URL, ApiError, apiRequest } from '@/lib/api';
import { saveAuthSession } from '@/lib/auth';

const AUTH_REQUEST_TIMEOUT_MS = 8000;

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // 前端基础验证
    if (!formData.username || !formData.password) {
      setError('请输入用户名和密码');
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const data = await apiRequest<{ access_token?: string }>(endpoint, {
        method: 'POST',
        auth: false,
        json: {
          username: formData.username,
          password: formData.password,
        },
        signal: controller.signal,
      });

      if (isLogin) {
        if (!data?.access_token) {
          throw new Error('登录响应缺少 access_token');
        }

        saveAuthSession(data.access_token, formData.username);
        router.push('/dashboard');
      } else {
        setSuccessMessage('注册成功，请使用刚创建的账号登录。');
        setIsLogin(true);
        setFormData({ username: formData.username, password: '', confirmPassword: '' });
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('请求超时，请确认后端服务已启动后重试');
      } else if (err instanceof TypeError) {
        setError(`无法连接到后端服务，请确认 ${API_BASE_URL} 已启动`);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message || '操作失败，请重试');
      } else {
        setError('操作失败，请重试');
      }
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center px-4">
      {/* 返回首页按钮 */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <span className="text-xl">←</span>
        <span>返回首页</span>
      </button>

      {/* 登录/注册卡片 */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Logo 和标题 */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-2 mb-4">
              <span className="text-4xl">💕</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                心灵奇旅 Soul
              </span>
            </div>
            <p className="text-gray-600">
              {isLogin ? '欢迎回来' : '创建你的账户'}
            </p>
          </div>

          {/* 切换登录/注册 */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
                setSuccessMessage('');
                setFormData({ username: '', password: '', confirmPassword: '' });
              }}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                isLogin
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
                setSuccessMessage('');
                setFormData({ username: '', password: '', confirmPassword: '' });
              }}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                !isLogin
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              注册
            </button>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {successMessage ? (
              <StatusBanner
                title="注册成功"
                message={successMessage}
                tone="success"
                onClose={() => setSuccessMessage('')}
              />
            ) : null}

            {/* 用户名输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="请输入用户名"
                disabled={loading}
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="请输入密码"
                disabled={loading}
              />
            </div>

            {/* 确认密码输入（仅注册时显示） */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  确认密码
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="请再次输入密码"
                  disabled={loading}
                />
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? '处理中...' : isLogin ? '登录' : '注册'}
            </button>
          </form>

          {/* 隐私提示 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 text-xl">🔒</span>
              <div className="text-sm text-gray-600">
                <p className="font-semibold text-gray-700 mb-1">隐私保护</p>
                <p>所有数据本地存储，不会上传到云端</p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <p className="text-center text-sm text-gray-500 mt-6">
          使用心灵奇旅即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
