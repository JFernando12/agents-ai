export function MethodBadge({ method }: { method: string }) {
  const colorMap: Record<string, string> = {
    GET: 'bg-green-100 text-green-700',
    POST: 'bg-blue-100 text-blue-700',
    PUT: 'bg-yellow-100 text-yellow-700',
    PATCH: 'bg-yellow-100 text-yellow-700',
    DELETE: 'bg-red-100 text-red-700',
  };
  return (
    <span
      className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${colorMap[method] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {method}
    </span>
  );
}
