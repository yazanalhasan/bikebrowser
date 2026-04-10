function TopicTile({ title, subtitle, emoji, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`card card-clickable p-8 text-center cursor-pointer
                  bg-gradient-to-br ${color} text-white`}
    >
      <div className="text-6xl mb-4">{emoji}</div>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-white text-opacity-90">{subtitle}</p>
    </div>
  );
}

export default TopicTile;
