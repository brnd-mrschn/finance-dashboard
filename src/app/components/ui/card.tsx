type CardProps = {
  title: string;
  value: string | number;
};

export function Card({ title, value }: CardProps) {
  return (
    <div className="bg-zinc-900 p-4 rounded-2xl shadow-md">
      <p className="text-zinc-400">{title}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  );
}