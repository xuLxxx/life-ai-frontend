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
import styles from './index.less';

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
    } catch (error) {
      const currentError = error as {
        data?: { message?: string };
        message?: string;
      };
      message.error(
        currentError.data?.message || currentError.message || '邮件发送失败',
      );
    } finally {
      setSending(false);
    }
  };

  if (verified) {
    return (
      <main className={styles.page}>
        <Result
          icon={<CheckCircleOutlined className={styles.successIcon} />}
          title="邮箱验证成功"
          subTitle="正在为你跳转，请稍候……"
        />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.icon}>
          <MailOutlined />
        </div>
        <Typography.Title level={2}>验证你的邮箱</Typography.Title>
        <Typography.Paragraph type="secondary">
          我们已向你的邮箱发送验证链接。打开邮件并点击链接即可完成认证；如果没有收到，请检查垃圾邮件或重新发送。
        </Typography.Paragraph>
        <Space.Compact block className={styles.emailRow}>
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
          className={styles.back}
          onClick={() => history.push('/login')}
        >
          返回登录
        </Button>
      </section>
    </main>
  );
};

export default VerifyEmailPage;
