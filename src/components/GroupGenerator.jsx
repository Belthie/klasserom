(function () {
    window.GroupGenerator = ({ students, title }) => {
        const [groupSize, setGroupSize] = React.useState(3);
        const [groups, setGroups] = React.useState([]);
        const [isAnimating, setIsAnimating] = React.useState(false);
        // Use a ref to track if we've done the initial generation to avoid double-shuffle on mount if strict mode
        const mounted = React.useRef(false);

        const generate = (size, currentStudents) => {
            if (!currentStudents || currentStudents.length === 0) return [];

            const shuffled = [...currentStudents].sort(() => Math.random() - 0.5);
            const chunks = [];

            for (let i = 0; i < shuffled.length; i += size) {
                chunks.push(shuffled.slice(i, i + size));
            }

            // Handle remainder of 1
            if (chunks.length > 1) {
                const last = chunks[chunks.length - 1];
                if (last.length === 1) {
                    const prev = chunks[chunks.length - 2];
                    if (size === 2) {
                        // Size 2, Remainder 1 -> Merge into previous (make it 3)
                        prev.push(last[0]);
                        chunks.pop();
                    } else {
                        // Size 3+, Remainder 1 -> Steal from previous (make it size-1, last=2)
                        // Example: Size 3. Prev=3, Last=1 -> Prev=2, Last=2.
                        const stolen = prev.pop();
                        last.unshift(stolen);
                    }
                }
            }

            return chunks;
        };

        // Initial Generation
        React.useEffect(() => {
            setGroups(generate(groupSize, students));
        }, [groupSize, students]); // Re-generate if size or students change

        const handleRegenerate = () => {
            setIsAnimating(true);
            setGroups(prev => []); // Tempoarily clear or keep? Better to keep and swap
            // Simulate anim
            setTimeout(() => {
                setGroups(generate(groupSize, students));
                setIsAnimating(false);
            }, 300);
        };

        return (
            <div className="w-full h-full flex flex-col items-center bg-slate-50/50">
                {/* Print Header */}
                <div className="hidden print:block w-full max-w-6xl mx-auto mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 border-b pb-2 mb-2">{title || "Random Groups"}</h1>
                    <p className="text-sm text-slate-500">Group Size: {groupSize} • Total Students: {students.length}</p>
                </div>

                {/* Controls */}
                <div className="w-full max-w-6xl mx-auto p-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-xs ml-2">Group Size</span>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {[2, 3, 4].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setGroupSize(s)}
                                    className={`px-4 py-1.5 rounded-md font-bold text-sm transition-all ${groupSize === s ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleRegenerate}
                        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
                    >
                        <window.Icon name="refresh-cw" size={18} className={isAnimating ? "animate-spin" : ""} />
                        Scramble Groups
                    </button>

                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <window.Icon name="printer" size={18} /> Print
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 w-full overflow-y-auto custom-scrollbar p-6">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:grid-cols-3 print:gap-4">
                        {groups.map((group, i) => (
                            <div
                                key={i}
                                className={`bg-white border-2 ${isAnimating ? 'border-slate-100 scale-95 opacity-50' : 'border-slate-200 scale-100 opacity-100'} rounded-2xl p-6 shadow-sm flex flex-col items-center transition-all duration-300 break-inside-avoid print:border shadow-none`}
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-lg mb-4 print:mb-2 print:w-8 print:h-8 print:text-sm">
                                    {i + 1}
                                </div>
                                <div className="w-full space-y-2">
                                    {group.map(s => (
                                        <div key={s.id} className="text-xl font-bold text-slate-800 text-center py-2 bg-slate-50 rounded-xl border border-slate-100 print:text-lg print:py-1 print:border-none print:bg-transparent">
                                            {s.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };
})();
