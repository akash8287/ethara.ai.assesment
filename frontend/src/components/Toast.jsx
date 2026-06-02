export default function Toast({ type, text }) {
  return <div className={`toast ${type}`}>{text}</div>;
}
