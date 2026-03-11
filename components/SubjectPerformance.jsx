'use client'

export default function SubjectPerformance({ performance }) {
  const subjectsData = performance?.subjectStats || {};

  let subjects = Object.entries(subjectsData).map(([name, percentage], index) => {
    const colors = ['#171717', '#666666', '#A3A3A3'];
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      percentage: Math.round(percentage),
      barColor: colors[index % colors.length]
    };
  });

  // Sort by highest percentage first and cap at top 5 to fit UI
  subjects.sort((a, b) => b.percentage - a.percentage);
  subjects = subjects.slice(0, 5);

  if (subjects.length === 0) {
    subjects = [
      { name: 'No exams taken yet', percentage: 0, barColor: '#EAEAEA' }
    ];
  }

  return (
    <section className="bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-medium text-[#171717]">Subject Performance</h2>
        <iconify-icon icon="solar:chart-square-linear" width="16" className="text-[#A3A3A3]" />
      </div>

      <div className="space-y-4">
        {subjects.map((subject, index) => (
          <div key={index}>
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-xs text-[#171717]">{subject.name}</span>
              <span className="text-xs text-[#666666]">{subject.percentage}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#FAFAFA] border border-[#EAEAEA] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${subject.percentage}%`, backgroundColor: subject.barColor }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
