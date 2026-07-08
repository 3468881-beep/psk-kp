export function ComingSoon({ title }: { title?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <div className="max-w-md rounded-[16px] border border-dashed border-[#DDD4C5] bg-white px-10 py-14 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#EFE9DE] text-2xl">
          🛠️
        </div>
        <div className="text-[15px] font-bold text-ink">
          {title ?? "Раздел в разработке"}
        </div>
        <div className="mt-1.5 text-[12.5px] text-muted">
          Появится на следующем шаге. Сейчас доступны «Расчёт КП» и «Архив КП».
        </div>
      </div>
    </div>
  );
}
