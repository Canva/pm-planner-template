export default function BriefDetailLoading() {
  return (
    <div className="flex flex-col flex-1">
      <div className="h-14 border-b border-gray-100 bg-white px-6 flex items-center shrink-0">
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="p-6 flex-1 flex items-center justify-center text-gray-400 text-sm">
        Loading brief…
      </div>
    </div>
  );
}
