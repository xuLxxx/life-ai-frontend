import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { App, Dropdown, type MenuProps } from 'antd';
import type { ReactNode } from 'react';
import { clearAuthSession } from '@/utils/auth';

const UserAvatarMenu = ({ children }: { children: ReactNode }) => {
  const { setInitialState } = useModel('@@initialState');
  const { message } = App.useApp();

  const onMenuClick: MenuProps['onClick'] = async ({ key }) => {
    if (key === 'profile') {
      history.push('/profile');
      return;
    }

    if (key === 'logout') {
      clearAuthSession();
      await setInitialState({ currentUser: null, name: '' });
      message.success('已退出登录');
      history.replace('/login');
    }
  };

  return (
    <Dropdown
      trigger={['click']}
      placement="topRight"
      menu={{
        onClick: onMenuClick,
        items: [
          { key: 'profile', label: '个人中心', icon: <UserOutlined /> },
          { type: 'divider' },
          {
            key: 'logout',
            label: '退出登录',
            icon: <LogoutOutlined />,
            danger: true,
          },
        ],
      }}
    >
      <button
        type="button"
        className="cursor-pointer border-0 bg-transparent p-0"
      >
        {children}
      </button>
    </Dropdown>
  );
};

export default UserAvatarMenu;
