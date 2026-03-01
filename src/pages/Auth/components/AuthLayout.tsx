interface Props {
  children: React.ReactNode;
  maxWidth?: string;
}

export default function AuthLayout({ children, maxWidth = 'max-w-[400px]' }: Props) {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl p-8 ${maxWidth} w-full`}>
        {children}
      </div>
    </div>
  );
}
