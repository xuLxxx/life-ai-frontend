import { UploadOutlined, UserOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { App, Avatar, Button, Card, Form, Input, Space } from 'antd';
import { useEffect, useState } from 'react';
import UploadImage from '@/components/UploadImage';
import {
  createAvatarUpload,
  getAvatarUrl,
  updateCurrentUser,
  uploadAvatarFile,
} from '@/services/profile';
import type { AuthUser } from '@/utils/auth';

const imageExtensions = ['jpg', 'jpeg', 'png', 'webp'] as const;
type ImageExtension = (typeof imageExtensions)[number];

const ProfilePage: React.FC = () => {
  const [form] = Form.useForm<{ displayName: string }>();
  const { initialState, setInitialState } = useModel('@@initialState');
  const { message } = App.useApp();
  const user = initialState?.currentUser as AuthUser | undefined;
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>();

  useEffect(() => {
    form.setFieldsValue({ displayName: user?.displayName || '' });
  }, [form, user?.displayName]);

  useEffect(() => {
    const path = user?.avatarPath;
    if (typeof path !== 'string' || !path) {
      setAvatarUrl(undefined);
      return;
    }

    let active = true;
    getAvatarUrl(path)
      .then((result) => {
        if (active) setAvatarUrl(result.url);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user?.avatarPath]);

  const saveProfile = async ({ displayName }: { displayName: string }) => {
    setSaving(true);
    try {
      const updated = await updateCurrentUser({ displayName });
      const nextUser = { ...user, ...updated };
      await setInitialState({
        ...initialState,
        currentUser: nextUser,
        name: nextUser.displayName || nextUser.email || '',
      });
      message.success('资料已保存');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    const extension = file.name
      .split('.')
      .pop()
      ?.toLowerCase() as ImageExtension;
    if (!imageExtensions.includes(extension)) {
      throw new Error('仅支持 JPG、PNG 和 WebP 图片');
    }

    const upload = await createAvatarUpload(extension);
    await uploadAvatarFile(file, upload);

    const updated = await updateCurrentUser({ avatarPath: upload.path });
    const nextUser = { ...user, ...updated, avatarPath: upload.path };
    await setInitialState({
      ...initialState,
      currentUser: nextUser,
      name: nextUser.displayName || nextUser.email || '',
    });
    const result = await getAvatarUrl(upload.path);
    if (typeof result.url !== 'string' || !result.url) {
      throw new Error('头像地址返回异常');
    }
    setAvatarUrl(result.url);
    message.success('头像上传成功，请保存');
  };

  return (
    <PageContainer ghost title="个人中心">
      <Card className="mx-auto  w-full max-w-190">
        <div className="flex mb-4 flex-col items-center gap-4 border-b border-border-secondary pb-6 sm:flex-row sm:items-start">
          <Avatar
            size={88}
            src={avatarUrl}
            icon={<UserOutlined />}
            className="bg-primary-100 text-primary-600"
          />
          <div className="flex-1 flex flex-col gap-1 text-center sm:text-left">
            <div className="text-lg font-semibold text-text-heading">
              {user?.displayName || '未设置昵称'}
            </div>
            <div className="mb-2 text-sm text-text-description">
              {user?.email || ''}
            </div>
            <UploadImage
              accept=".jpg,.jpeg,.png,.webp"
              onUpload={uploadAvatar}
              trigger={
                <Button
                  classNames={{
                    icon: 'text-[11px]',
                  }}
                  style={{ fontSize: '11px' }}
                  size={'small'}
                  icon={<UploadOutlined />}
                >
                  上传新头像
                </Button>
              }
            />
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          className="mt-6"
          requiredMark={false}
          onFinish={saveProfile}
        >
          <Form.Item
            label="昵称"
            name="displayName"
            rules={[
              { required: true, message: '请输入昵称' },
              { max: 80, message: '昵称不能超过 80 个字符' },
            ]}
          >
            <Input placeholder="请输入昵称" maxLength={80} showCount />
          </Form.Item>

          <Form.Item label="邮箱">
            <Input value={user?.email || ''} disabled />
            <div className="mt-2 text-xs text-text-description">
              邮箱暂不支持修改
            </div>
          </Form.Item>

          <Form.Item className="mb-0">
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                保存修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default ProfilePage;
