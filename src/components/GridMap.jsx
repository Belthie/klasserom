
(function () {
    window.GridMap = ({ layout, roomConfig, onSwap, onAssign, selection }) => {
        const { rows, cols } = roomConfig;

        const handleDragStart = (e, index, student) => {
            e.dataTransfer.setData('currIndex', index);
            e.dataTransfer.setData('type', 'seat');
            if (student) {
                e.dataTransfer.setData('studentId', student.id);
            }
            e.dataTransfer.effectAllowed = 'move';
        };

        const handleDrop = (e, targetIndex) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('type');

            if (type === 'sidebar_student') {
                const studentId = e.dataTransfer.getData('studentId');
                onAssign(studentId, targetIndex);
            } else if (type === 'seat') {
                const sourceIndex = parseInt(e.dataTransfer.getData('currIndex'));
                if (sourceIndex !== targetIndex) {
                    onSwap(sourceIndex, targetIndex);
                }
            }
        };

        const handleDragOver = (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        };

        return (
            <div
                id="seating-grid"
                className="grid gap-3 p-6 bg-white rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:bg-transparent"
                style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
                }}
            >
                {layout.map((student, index) => {
                    const isSelected = selection && selection.includes(index); // For broken rule highlighting

                    return (
                        <div
                            key={index}
                            className={`
                                relative min-h-[100px] rounded-lg border-2 flex flex-col items-center justify-center p-2 text-center transition-all cursor-move
                                ${student
                                    ? (isSelected ? 'bg-red-50 border-red-400 z-10' : 'bg-white border-slate-200 hover:border-brand-400 hover:shadow-md')
                                    : 'bg-slate-50 border-dashed border-slate-200 hover:bg-slate-100'}
                            `}
                            draggable="true"
                            onDragStart={(e) => handleDragStart(e, index, student)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragOver={handleDragOver}
                        >
                            {student ? (
                                <>
                                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold mb-2">
                                        {student.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">
                                        {student.name}
                                    </div>
                                    {/* Constraints Indicators */}
                                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                                        {student.constraints.includes('lock_front') && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Front Locked"></div>}
                                        {student.constraints.includes('lock_back') && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Back Locked"></div>}
                                    </div>
                                </>
                            ) : (
                                <span className="text-xs font-bold text-slate-300 select-none">{index + 1}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };
})();
