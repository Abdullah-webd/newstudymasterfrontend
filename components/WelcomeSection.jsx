'use client'

export default function WelcomeSection({ user, motivation }) {
  const greetingName = user?.username || 'Student';

  // Decide Good Morning/Afternoon/Evening based on local time
  const hour = new Date().getHours();
  let timeOfDay = 'Evening';
  if (hour < 12) timeOfDay = 'Morning';
  else if (hour < 18) timeOfDay = 'Afternoon';

  return (
    <section className="bg-white border border-[#EAEAEA] rounded-xl p-5 md:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5 mt-4">
      <div className="hidden md:flex w-12 h-12 shrink-0 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 border border-[#EAEAEA] items-center justify-center">
        <iconify-icon icon="solar:user-rounded-linear" width="24" className="text-[#666666]" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-[#666666] mb-1">Good {timeOfDay}, {greetingName}</p>
        <h1 className="text-lg md:text-xl font-medium tracking-tight text-[#171717] mb-2">Welcome back, keep learning!</h1>
        <p className="text-sm text-[#666666] leading-relaxed max-w-3xl">
          "{motivation || 'Every question you solve today brings you closer to passing your exams. Stay consistent and keep pushing forward.'}"
        </p>
      </div>
    </section>
  )
}
