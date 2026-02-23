export default function Header({ title }) {
  return (
    <header className="bg-primary text-white py-4 px-5 shadow-md">
      <h1 className="text-xl font-semibold">{title}</h1>
    </header>
  );
}
