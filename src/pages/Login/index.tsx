import { signIn, signUp } from '@/services/auth';
import { getCurrentUser } from '@/services/profile';
import {
  getAccessToken,
  saveAuthResponse,
  saveVerificationEmail,
} from '@/utils/auth';
import { LockOutlined, MailOutlined, RobotOutlined } from '@ant-design/icons';
import { history, useModel, useSearchParams } from '@umijs/max';
import { App, Button, Form, Input, Tabs, Typography } from 'antd';
import { useEffect, useState } from 'react';
import CheckEmail from './components/CheckEmail';
import RegisterForm, {
  type RegisterFormValues,
} from './components/RegisterForm';

type Mode = 'login' | 'register';

type LoginFormValues = {
  email: string;
  password: string;
};

const emailRules = [
  { required: true, message: '请输入邮箱地址' },
  { type: 'email' as const, message: '请输入有效的邮箱地址' },
  { max: 254, message: '邮箱地址不能超过 254 个字符' },
];

const LoginPage: React.FC = () => {
  const [form] = Form.useForm<LoginFormValues>();
  const [mode, setMode] = useState<Mode>('login');
  const [submitting, setSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const { message } = App.useApp();
  const { initialState, setInitialState } = useModel('@@initialState');

  useEffect(() => {
    if (initialState?.currentUser && getAccessToken()) history.replace('/');
  }, [initialState?.currentUser]);

  const submitLogin = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      const response = await signIn(values);
      const user = saveAuthResponse(response);
      if (!getAccessToken()) {
        throw new Error('登录成功，但服务未返回访问令牌');
      }
      const currentUser = user ?? (await getCurrentUser());
      await setInitialState({
        currentUser,
        name: currentUser.displayName || currentUser.email || values.email,
      });
      message.success('登录成功');
      history.replace(searchParams.get('redirect') || '/');
    } catch (error) {
      const currentError = error as {
        response?: { status?: number };
        data?: { message?: string };
        message?: string;
      };
      if (currentError.response?.status === 403) {
        saveVerificationEmail(values.email);
        history.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const submitRegister = async (values: RegisterFormValues) => {
    setSubmitting(true);
    try {
      await signUp({
        email: values.email,
        password: values.password,
        displayName: values.displayName,
      });
      saveVerificationEmail(values.email);
      setRegisteredEmail(values.email);
      message.success('注册成功，请检查邮箱');
    } catch {
      // 请求错误由全局 requestErrorConfig 展示。
    } finally {
      setSubmitting(false);
    }
  };

  const changeMode = (key: string) => {
    setMode(key as Mode);
    setRegisteredEmail(null);
    form.resetFields();
  };

  return (
    <main className="grid min-h-screen grid-cols-1 items-center gap-7 bg-[#f7f6fc] px-5 py-8 [background-image:radial-gradient(circle_at_12%_12%,rgba(123,91,236,0.28),transparent_28%),radial-gradient(circle_at_88%_88%,rgba(86,64,165,0.18),transparent_30%)] lg:grid-cols-[minmax(320px,1fr)_minmax(420px,0.9fr)] lg:gap-[clamp(40px,8vw,120px)] lg:px-[clamp(32px,6vw,96px)] lg:py-[clamp(32px,6vw,96px)]">
      <section className="max-w-[560px] justify-self-center text-center text-text-heading lg:justify-self-auto lg:text-left">
        <div className="mx-auto mb-7 grid h-16 w-16 place-items-center rounded-[18px] bg-gradient-to-br from-primary-400 to-primary-700 text-[32px] text-white shadow-[0_18px_40px_rgba(86,64,165,0.25)] lg:mx-0">
          <RobotOutlined />
        </div>
        <Typography.Title className="!mb-4 !text-[42px] !tracking-[-0.04em] lg:!text-[clamp(42px,5vw,72px)]">
          Life AI
        </Typography.Title>
        <Typography.Paragraph className="!mb-0 hidden !text-[clamp(16px,1.5vw,20px)] !leading-[1.8] text-text-secondary lg:block">
          让智能成为日常生活的一部分，
          <br />
          在一个地方管理你的资料与体验。
        </Typography.Paragraph>
      </section>

      <section className="w-full max-w-[480px] justify-self-center rounded-3xl border border-white/80 bg-white/90 p-7 shadow-[0_30px_80px_rgba(55,43,106,0.12)] backdrop-blur-xl sm:p-10 lg:p-[clamp(28px,4vw,46px)]">
        {registeredEmail ? (
          <CheckEmail
            email={registeredEmail}
            onBackToLogin={() => {
              setRegisteredEmail(null);
              setMode('login');
            }}
          />
        ) : (
          <>
            <div className="mb-6 text-center">
              <Typography.Title level={2} className="!mb-2">
                欢迎使用 Life AI
              </Typography.Title>
              <Typography.Text type="secondary">
                {mode === 'login'
                  ? '登录你的账户，继续探索'
                  : '创建账户，开启智能生活'}
              </Typography.Text>
            </div>

            <Tabs
              activeKey={mode}
              centered
              items={[
                { key: 'login', label: '登录' },
                { key: 'register', label: '注册' },
              ]}
              onChange={changeMode}
            />

            {mode === 'register' ? (
              <RegisterForm submitting={submitting} onSubmit={submitRegister} />
            ) : (
              <Form<LoginFormValues>
                form={form}
                layout="vertical"
                requiredMark={false}
                onFinish={submitLogin}
                className="mt-2"
              >
                <Form.Item label="邮箱" name="email" rules={emailRules}>
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="name@example.com"
                    size="large"
                    autoComplete="email"
                  />
                </Form.Item>

                <Form.Item
                  label="密码"
                  name="password"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { max: 72, message: '密码不能超过 72 个字符' },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="请输入密码"
                    size="large"
                    autoComplete="current-password"
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={submitting}
                  className="mt-2 h-12 rounded-[10px] shadow-[0_10px_24px_rgba(123,91,236,0.24)]"
                >
                  登录
                </Button>
              </Form>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export default LoginPage;
