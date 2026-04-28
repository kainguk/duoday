import DateForm from "@/components/DateForm";

export default function NewDatePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="h-display text-3xl text-blossom-800 mb-2">새 데이트 기록</h1>
      <p className="text-blossom-500 mb-6">언제, 어디서, 어떤 마음이었는지 남겨주세요.</p>
      <div className="card p-6 md:p-8">
        <DateForm />
      </div>
    </div>
  );
}
