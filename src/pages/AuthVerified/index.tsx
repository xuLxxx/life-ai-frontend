import { CheckCircleOutlined, LoginOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { Button, Result } from 'antd';

const AuthVerifiedPage: React.FC = () => (
  <main className="grid min-h-screen place-items-center bg-[#f7f6fc] p-6 bg-[radial-gradient(circle_at_20%_20%,rgba(123,91,236,0.18),transparent_28%)]">
    <section className="w-full max-w-135 rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_30px_80px_rgba(55,43,106,0.12)] sm:p-10">
      <Result
        status="success"
        icon={<CheckCircleOutlined className="text-7xl text-success" />}
        title="邮箱验证成功"
        subTitle="你的账户已经完成认证，现在可以登录 Life AI。"
        extra={
          <Button
            type="primary"
            size="large"
            icon={<LoginOutlined />}
            onClick={() => history.replace('/login')}
          >
            前往登录
          </Button>
        }
      />
    </section>
  </main>
);

export default AuthVerifiedPage;
