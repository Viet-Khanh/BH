import { Link } from 'react-router-dom';

const BigTileButton = ({ to, label, tone }) => {
  const background = tone || 'linear-gradient(135deg, #0f8f8a, #0bb45a)';
  return (
    <Link to={to} className="big-tile" style={{ background }}>
      {label}
    </Link>
  );
};

export default BigTileButton;
