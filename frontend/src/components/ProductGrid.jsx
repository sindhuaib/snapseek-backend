export default function ProductGrid({ products, showScore = false }) {
  if (!products.length) return <p>No products to display.</p>;
  return (
    <div className="isw-grid">
      {products.map((p) => (
        <a
          key={p._id}
          href={p.link}
          target="_blank"
          rel="noreferrer"
          className="isw-card"
        >
          <img src={p.imageUrl} alt={p.title} />
          <div className="isw-card-body">
            <h3>{p.title}</h3>
            {showScore && p.score != null && (
              <p className="isw-score">Match: {(p.score * 100).toFixed(1)}%</p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}
