import BigTileButton from '../components/BigTileButton.jsx';

const Home = () => {
  return (
    <div className="page-card">
      <div className="page-title">Màn hình chính</div>
      <div className="home-grid">
        <BigTileButton to="/system" label="HỆ THỐNG" tone="linear-gradient(135deg, #0f6f75, #0d8f8a)" />
        <BigTileButton to="/catalog" label="DANH MỤC" tone="linear-gradient(135deg, #118d6c, #0dbf6a)" />
        <BigTileButton to="/sales" label="BÁN HÀNG" tone="linear-gradient(135deg, #0f8f8a, #14b36a)" />
        <BigTileButton to="/purchases" label="NHẬP HÀNG" tone="linear-gradient(135deg, #12a36e, #0bc26b)" />
        <BigTileButton to="/cashbook" label="THU CHI" tone="linear-gradient(135deg, #0f7f86, #0ea06d)" />
        <BigTileButton to="/reports" label="BÁO CÁO" tone="linear-gradient(135deg, #0c7c78, #0f9e8b)" />
      </div>
    </div>
  );
};

export default Home;
