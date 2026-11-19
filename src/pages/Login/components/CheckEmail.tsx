import { ArrowLeftOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';

type CheckEmailProps = {
  email: string;
  onBackToLogin: () => void;
};

const CheckEmail: React.FC<CheckEmailProps> = ({ email, onBackToLogin }) => (
  <section className="py-2 text-center">
    <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-primary-50 text-[34px] text-primary-500">
      <MailOutlined />
    </div>
    <Typography.Title level={2} className="!mb-3">
      检查你的邮箱
    </Typography.Title>
    <Typography.Paragraph className="!mb-2 text-base text-text-secondary">
      注册成功，验证链接已发送至
    </Typography.Paragraph>
    <Typography.Paragraph strong className="!mb-6 break-all !text-primary-600">
      {email}
    </Typography.Paragraph>
    <div className="rounded-xl border border-primary-100 bg-primary-50/70 px-4 py-3 text-sm leading-6 text-text-secondary">
      请打开邮件并点击验证链接完成认证。未收到邮件时，请检查垃圾邮件文件夹。
    </div>
    <Button
      type="link"
      icon={<ArrowLeftOutlined />}
      className="mt-5"
      onClick={onBackToLogin}
    >
      返回登录
    </Button>
  </section>
);

export default CheckEmail;
