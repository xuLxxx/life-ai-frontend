import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';

export type RegisterFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
};

type RegisterFormProps = {
  submitting: boolean;
  onSubmit: (values: RegisterFormValues) => Promise<void>;
};

const emailRules = [
  { required: true, message: '请输入邮箱地址' },
  { type: 'email' as const, message: '请输入有效的邮箱地址' },
  { max: 254, message: '邮箱地址不能超过 254 个字符' },
];

const RegisterForm: React.FC<RegisterFormProps> = ({
  submitting,
  onSubmit,
}) => (
  <Form<RegisterFormValues>
    layout="vertical"
    requiredMark={false}
    onFinish={onSubmit}
    className="mt-2"
  >
    <Form.Item
      label="姓名"
      name="displayName"
      rules={[
        { required: true, message: '请输入姓名' },
        { max: 80, message: '姓名不能超过 80 个字符' },
      ]}
    >
      <Input prefix={<UserOutlined />} placeholder="请输入姓名" size="large" />
    </Form.Item>

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
        { min: 8, message: '密码至少需要 8 个字符' },
        { max: 72, message: '密码不能超过 72 个字符' },
      ]}
    >
      <Input.Password
        prefix={<LockOutlined />}
        placeholder="至少 8 个字符"
        size="large"
        autoComplete="new-password"
      />
    </Form.Item>

    <Form.Item
      label="确认密码"
      name="confirmPassword"
      dependencies={['password']}
      rules={[
        { required: true, message: '请再次输入密码' },
        ({ getFieldValue }) => ({
          validator(_, value) {
            return !value || getFieldValue('password') === value
              ? Promise.resolve()
              : Promise.reject(new Error('两次输入的密码不一致'));
          },
        }),
      ]}
    >
      <Input.Password
        prefix={<LockOutlined />}
        placeholder="再次输入密码"
        size="large"
        autoComplete="new-password"
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
      创建账户
    </Button>
  </Form>
);

export default RegisterForm;
