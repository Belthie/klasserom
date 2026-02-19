
(function () {
    window.GroupGenerator = ({ students, title, isStudentMode }) => {
        const [groupSize, setGroupSize] = React.useState(3);
        const [groups, setGroups] = React.useState([]);
        const [isAnimating, setIsAnimating] = React.useState(false);
        const [draggedItem, setDraggedItem] = React.useState(null); // { groupIndex, studentIndex, student }

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
        }, [groupSize, students]);

        const handleRegenerate = () => {
            setIsAnimating(true);
            setGroups([]);
            setTimeout(() => {
                setGroups(generate(groupSize, students));
                setIsAnimating(false);
            }, 300);
        };

        // --- Drag & Drop Handlers ---
        const handleDragStart = (e, groupIndex, studentIndex, student) => {
            setDraggedItem({ groupIndex, studentIndex, student });
            e.dataTransfer.effectAllowed = 'move';
            // Set drag image or data if needed
            // e.dataTransfer.setData('text/plain', JSON.stringify({ groupIndex, studentIndex }));
        };

        const handleDragOver = (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move'; // Show that it's a valid drop target
        };

        const handleDropOnStudent = (e, targetGroupIndex, targetStudentIndex) => {
            e.preventDefault();
            if (!draggedItem) return;

            // Scenario 1: Swap two students
            const sourceGroupIdx = draggedItem.groupIndex;
            const sourceStudentIdx = draggedItem.studentIndex;

            if (sourceGroupIdx === targetGroupIndex && sourceStudentIdx === targetStudentIndex) {
                setDraggedItem(null);
                return; // Dropped on self
            }

            const newGroups = [...groups];
            const sourceGroup = [...newGroups[sourceGroupIdx]];
            const targetGroup = [...newGroups[targetGroupIndex]];

            // Swap logic
            const sourceStudent = sourceGroup[sourceStudentIdx];
            const targetStudent = targetGroup[targetStudentIndex];

            // If same group, just swap in array
            if (sourceGroupIdx === targetGroupIndex) {
                sourceGroup[sourceStudentIdx] = targetStudent;
                sourceGroup[targetStudentIndex] = sourceStudent;
                newGroups[sourceGroupIdx] = sourceGroup;
            } else {
                // Different groups
                sourceGroup[sourceStudentIdx] = targetStudent;
                targetGroup[targetStudentIndex] = sourceStudent;
                newGroups[sourceGroupIdx] = sourceGroup;
                newGroups[targetGroupIndex] = targetGroup;
            }

            setGroups(newGroups);
            setDraggedItem(null);
        };

        // Optional: Allow dropping on empty space in group to specificially MOVE instead of SWAP?
        // For now, let's keep it simple: Drag onto another student = Swap.
        // What if user wants to move a student to a group that has space (e.g. if we allow uneven groups)?
        // The current generator logic tries to keep groups full.
        // Let's stick to SWAP for now as per user request.

        return (
            <div className={`w-full h-full flex flex-col items-center ${isStudentMode ? 'bg-transparent' : 'bg-slate-50/50'}`}>
                {/* Print Header */}
                <div className="hidden print:block w-full max-w-6xl mx-auto mb-6">
                    <h1 className={`text-2xl font-bold border-b pb-2 mb-2 print:text-slate-900 print:border-slate-200 ${isStudentMode ? 'text-white border-slate-700' : 'text-slate-900 border-slate-200'}`}>{title || "Tilfeldige grupper"}</h1>
                    <p className={`text-sm print:text-slate-500 ${isStudentMode ? 'text-slate-400' : 'text-slate-500'}`}>Gruppestørrelse: {groupSize} • Antall elever: {students.length}</p>
                </div>

                {/* Controls */}
                {/* Controls - Visible in both modes, styled differently */}
                <div className="w-full max-w-6xl mx-auto p-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                    <div className={`flex items-center gap-4 p-2 rounded-xl shadow-sm border ${isStudentMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <span className={`font-bold uppercase tracking-wider text-xs ml-2 ${isStudentMode ? 'text-slate-400' : 'text-slate-500'}`}>Antall</span>
                        <div className={`flex p-1 rounded-lg ${isStudentMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                            {[2, 3, 4].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setGroupSize(s)}
                                    className={`px-4 py-1.5 rounded-md font-bold text-sm transition-all ${groupSize === s ? (isStudentMode ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-brand-600 shadow-sm') : (isStudentMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')}`}
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
                        Bland grupper
                    </button>

                    <button
                        onClick={() => window.print()}
                        className={`px-4 py-2.5 border font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 ${isStudentMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        <window.Icon name="printer" size={18} /> Skriv ut
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 w-full overflow-y-auto custom-scrollbar p-6">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:grid-cols-3 print:gap-4">
                        {groups.map((group, groupIndex) => (
                            <div
                                key={groupIndex}
                                className={`${isStudentMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-2 ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'} rounded-2xl p-6 shadow-sm flex flex-col items-center transition-all duration-300 break-inside-avoid print:border shadow-none`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-4 print:mb-2 print:w-8 print:h-8 print:text-sm ${isStudentMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-400'}`}>
                                    {groupIndex + 1}
                                </div>
                                <div className="w-full space-y-2">
                                    {group.map((s, studentIndex) => (
                                        <div
                                            key={s.id}
                                            draggable={!isStudentMode}
                                            onDragStart={(e) => !isStudentMode && handleDragStart(e, groupIndex, studentIndex, s)}
                                            onDragOver={!isStudentMode ? handleDragOver : undefined}
                                            onDrop={(e) => !isStudentMode && handleDropOnStudent(e, groupIndex, studentIndex)}
                                            className={`text-xl font-bold text-center py-2 rounded-xl border cursor-default transition-all print:text-lg print:py-1 print:border-none print:bg-transparent
                                                ${isStudentMode
                                                    ? 'bg-slate-700 border-slate-600 text-white'
                                                    : 'bg-slate-50 border-slate-100 text-slate-800 cursor-grab active:cursor-grabbing hover:border-brand-300 hover:shadow-sm'
                                                }
                                            `}
                                        >
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
