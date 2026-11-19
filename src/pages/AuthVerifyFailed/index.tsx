import { CloseCircleOutlined, LoginOutlined } from '@ant-design/icons';
import { history, useSearchParams } from '@umijs/max';
import { Button, Result } from 'antd';

const AuthVerifyFailedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const errorMessage =
    searchParams.get('message') ||
    '邮箱验证失败，链接可能已失效，请重新注册或发送验证邮件。';

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f6fc] p-6 bg-[radial-gradient(circle_at_20%_20%,rgba(123,91,236,0.18),transparent_28%)]">
      <section className="w-full max-w-135 rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_30px_80px_rgba(55,43,106,0.12)] sm:p-10">
        <Result
          status="error"
          icon={<CloseCircleOutlined className="text-7xl text-error" />}
          title="邮箱验证失败"
          subTitle={
            <span className="inline-block whitespace-pre-wrap wrap-break-word">
              {errorMessage}
            </span>
          }
          extra={
            <Button
              type="primary"
              size="large"
              icon={<LoginOutlined />}
              onClick={() => history.replace('/login')}
            >
              返回登录
            </Button>
          }
        />
      </section>
    </main>
  );
};

export default AuthVerifyFailedPage;
