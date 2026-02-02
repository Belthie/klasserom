
(function () {
    window.StudentCard = ({ student, onEdit, isDragging, dragHandleProps }) => {
        return (
            <div
                className={`p-3 select-none bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-between group transition-all ${isDragging ? 'shadow-lg ring-2 ring-brand-500 rotate-2 z-50' : 'hover:border-brand-300'}`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        {...dragHandleProps}
                        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-brand-600 font-bold shrink-0 cursor-grab active:cursor-grabbing"
                    >
                        {student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{student.name}</div>
                        {student.constraints && student.constraints.length > 0 && (
                            <div className="flex gap-1 mt-0.5 flex-wrap">
                                {student.constraints.includes('lock_front') && <span className="text-[10px] text-amber-600 bg-amber-50 px-1 rounded">Front</span>}
                                {student.enemies && student.enemies.length > 0 && <span className="text-[10px] text-red-600 bg-red-50 px-1 rounded">Separation</span>}
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(student); }}
                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <window.Icon name="settings" size={16} />
                </button>
            </div>
        );
    };
})();
