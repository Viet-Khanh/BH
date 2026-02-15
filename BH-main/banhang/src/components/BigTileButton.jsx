import { Link } from 'react-router-dom';

const BigTileButton = ({ to, label, tone, onClick }) => {
  const background = tone || 'linear-gradient(135deg, #0f8f8a, #0bb45a)';
  if (to) {
    return (
      <Link to={to} className="big-tile" style={{ background }} onClick={onClick}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="big-tile"
      style={{ background, border: 'none', cursor: 'pointer' }}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default BigTileButton;
