import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import Guide from '@/components/Guide';

const HomePage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const name =
    initialState?.currentUser?.displayName || initialState?.name || '';

  return (
    <PageContainer ghost>
      <div className="pt-20">
        <Guide name={name} />
      </div>
    </PageContainer>
  );
};

export default HomePage;
