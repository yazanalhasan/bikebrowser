export default function ChainLinkIllustration({ factorA = 3, factorB = 4 }) {
  const links = Array.from({ length: factorA * factorB }, (_, index) => index);
  return (
    <div className="edu-illustration">
      <svg viewBox="0 0 420 300">
        {links.map((link) => (
          <rect key={link} x={34 + (link % factorB) * 76} y={48 + Math.floor(link / factorB) * 46} width="58" height="26" rx="13" fill={Math.floor(link / factorB) % 2 ? '#14b8a6' : '#2459ff'} opacity="0.82" />
        ))}
        <text x="36" y="260" fontSize="22" fontWeight="900">{factorA} chain sections x {factorB} links</text>
      </svg>
    </div>
  );
}
