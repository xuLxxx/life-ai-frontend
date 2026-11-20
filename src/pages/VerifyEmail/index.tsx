import { resendVerification } from '@/services/auth';
import {
  clearAuthSession,
  getVerificationEmail,
  readAuthTokenFromUrl,
  saveAccessToken,
} from '@/utils/auth';
import { CheckCircleOutlined, MailOutlined } from '@ant-design/icons';
import { history, useSearchParams } from '@umijs/max';
import { App, Button, Input, Result, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(
    searchParams.get('email') ?? getVerificationEmail() ?? '',
  );
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verified, setVerified] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    const token = readAuthTokenFromUrl();
    const status = searchParams.get('status');
    if (token) {
      saveAccessToken(token);
      setVerified(true);
      message.success('邮箱验证成功');
      window.setTimeout(() => history.replace('/'), 1200);
    } else if (status === 'success' || status === 'verified') {
      clearAuthSession();
      setVerified(true);
      window.setTimeout(() => history.replace('/login'), 1200);
    }
  }, []);

  useEffect(() => {
    if (!countdown) return;
    const timer = window.setTimeout(
      () => setCountdown((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const resend = async () => {
    if (!email.trim()) {
      message.warning('请先输入注册邮箱');
      return;
    }
    setSending(true);
    try {
      await resendVerification(email.trim());
      setCountdown(60);
      message.success('验证邮件已重新发送，请检查收件箱');
    } catch {
    } finally {
      setSending(false);
    }
  };

  if (verified) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f6fc] p-6 bg-[radial-gradient(circle_at_20%_20%,rgba(123,91,236,0.18),transparent_28%)]">
        <Result
          icon={<CheckCircleOutlined className="text-7xl text-success" />}
          title="邮箱验证成功"
          subTitle="正在为你跳转，请稍候……"
        />
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f6fc] p-6 bg-[radial-gradient(circle_at_20%_20%,rgba(123,91,236,0.18),transparent_28%)]">
      <section className="w-full max-w-135 rounded-3xl border border-white/80 bg-white/95 p-8 text-center shadow-[0_30px_80px_rgba(55,43,106,0.12)] sm:p-12 lg:p-[clamp(32px,6vw,56px)]">
        <div className="mx-auto mb-6 grid h-18 w-18 place-items-center rounded-full bg-primary-50 text-[32px] text-primary-500">
          <MailOutlined />
        </div>
        <Typography.Title level={2}>验证你的邮箱</Typography.Title>
        <Typography.Paragraph type="secondary">
          我们已向你的邮箱发送验证链接。打开邮件并点击链接即可完成认证；如果没有收到，请检查垃圾邮件或重新发送。
        </Typography.Paragraph>
        <Space.Compact block className="mt-6">
          <Input
            prefix={<MailOutlined />}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="输入注册邮箱"
            size="large"
          />
          <Button
            size="large"
            loading={sending}
            disabled={countdown > 0}
            onClick={resend}
          >
            {countdown > 0 ? `${countdown} 秒后重发` : '重发邮件'}
          </Button>
        </Space.Compact>
        <Button
          type="link"
          className="mt-4.5"
          onClick={() => history.push('/login')}
        >
          返回登录
        </Button>
      </section>
    </main>
  );
};

export default VerifyEmailPage;
