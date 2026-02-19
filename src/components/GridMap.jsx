
(function () {
    window.GridMap = ({ layout, roomConfig, onSwap, onAssign, onEdit, selection, violationIndices, onToggleSelection, customGroups = [], isFurnitureMode, onFurnitureClick, students = [], isStudentMode }) => {
        const { rows, cols, grouping } = roomConfig;

        // Resolve layout IDs to Student Objects
        const displayLayout = layout.map(item => {
            if (!item) return null;
            if (typeof item === 'object') return item; // Already an object (legacy/gen)
            return students.find(s => s.id === item) || null; // Resolve ID
        });

        // Stronger Colors for Groups
        const GROUP_COLORS = [
            'bg-blue-100 border-blue-200', 'bg-green-100 border-green-200',
            'bg-orange-100 border-orange-200', 'bg-purple-100 border-purple-200',
            'bg-pink-100 border-pink-200', 'bg-teal-100 border-teal-200',
            'bg-indigo-100 border-indigo-200', 'bg-cyan-100 border-cyan-200'
        ];

        const getGroupColor = (index) => {
            // Check Custom Groups first (Priority over Auto-Grouping)
            const customGroup = customGroups.find(g => g.ids.includes(index));
            if (customGroup) {
                if (customGroup.type === 'void') return 'void';
                return customGroup.color;
            }

            if (grouping === 'None') return '';

            const r = Math.floor(index / cols);
            const c = index % cols;
            let groupId = -1;

            if (grouping === 'Pairs') {
                groupId = (r * Math.ceil(cols / 2)) + Math.floor(c / 2);
            } else if (grouping === 'Groups of 4') {
                groupId = (Math.floor(r / 2) * Math.ceil(cols / 2)) + Math.floor(c / 2);
            }

            if (groupId === -1) return '';
            return GROUP_COLORS[groupId % GROUP_COLORS.length];
        };

        // Helper to determine the effective group ID for a seat
        const getEffectiveGroupId = (index) => {
            // 1. Custom Group (Priority)
            const customGroup = customGroups.find(g => g.ids.includes(index));
            if (customGroup) return `custom-${customGroup.id}`; // Void groups are also groups regarding spacing

            // 2. Auto Group
            if (grouping === 'None') return null;

            const r = Math.floor(index / cols);
            const c = index % cols;
            let autoId = -1;

            if (grouping === 'Pairs') {
                autoId = (r * Math.ceil(cols / 2)) + Math.floor(c / 2);
            } else if (grouping === 'Groups of 4') {
                autoId = (Math.floor(r / 2) * Math.ceil(cols / 2)) + Math.floor(c / 2);
            }

            if (autoId !== -1) return `auto-${autoId}`;
            return null;
        };

        const getSpacingClass = (index) => {
            const r = Math.floor(index / cols);
            const c = index % cols;
            let classes = '';

            const currentGroupId = getEffectiveGroupId(index);

            // Horizontal Spacing
            if (c < cols - 1) {
                const rightGroupId = getEffectiveGroupId(index + 1);
                // Add spacer if the right neighbor belongs to a different group (or one is grouped and other is not)
                // Note: If both are null (no group), we don't add extra space.
                if (currentGroupId !== rightGroupId) {
                    // Exception: If both are null, don't add space (standard grid gap applies)
                    if (currentGroupId !== null || rightGroupId !== null) {
                        classes += ' mr-6 ';
                    }
                }
            }

            // Vertical Spacing
            if (r < rows - 1) {
                const bottomGroupId = getEffectiveGroupId(index + cols);
                if (currentGroupId !== bottomGroupId) {
                    if (currentGroupId !== null || bottomGroupId !== null) {
                        classes += ' mb-6 ';
                    }
                }
            }

            return classes;
        };

        const handleDragStart = (e, index, student) => {
            if (onToggleSelection) {
                e.preventDefault();
                return;
            }
            e.dataTransfer.setData('currIndex', index);
            e.dataTransfer.setData('type', 'seat');
            if (student) {
                e.dataTransfer.setData('studentId', student.id);
            }
            e.dataTransfer.effectAllowed = 'move';
        };

        const handleDrop = (e, targetIndex) => {
            e.preventDefault();
            if (onToggleSelection) return;

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
                className="grid gap-2 p-6 bg-white rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:bg-transparent"
                style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
                }}
            >
                {displayLayout.map((student, index) => {
                    const isSelected = selection && selection.includes(index);
                    const isViolation = violationIndices && violationIndices.includes(index);
                    const groupColorStr = getGroupColor(index);
                    const spacingClass = getSpacingClass(index);

                    // Priority: Selected (Blue) > Violation (Red) > Group Color > Default
                    let baseColor = 'bg-white';
                    let borderColor = 'border-slate-200';
                    let isVoid = groupColorStr === 'void';

                    if (customGroups.some(g => g.type === 'void' && g.ids.includes(index))) {
                        isVoid = true;
                    }

                    if (isSelected && !isStudentMode) {
                        baseColor = 'bg-brand-100';
                        borderColor = 'border-brand-500 ring-2 ring-brand-300 ring-offset-1 z-20';
                    } else if (isVoid) {
                        baseColor = 'bg-transparent'; // or bg-slate-50
                        borderColor = 'border-transparent';
                    } else if (isViolation && !isStudentMode) {
                        baseColor = 'bg-red-100';
                        borderColor = 'border-red-400 z-10';
                    } else if (groupColorStr) {
                        // Extract parts if coming from tailwind strings
                        baseColor = groupColorStr.split(' ')[0] || 'bg-slate-50';
                        borderColor = groupColorStr.split(' ')[1] || 'border-slate-200';
                    } else {
                        baseColor = student ? 'bg-white' : 'bg-slate-50';
                        borderColor = student ? 'border-slate-200' : 'border-dashed border-slate-200';
                    }

                    const finalClass = `
                        ${baseColor} ${borderColor}
                        ${!onToggleSelection && !student && !isVoid ? 'hover:bg-opacity-80' : ''}
                        ${!onToggleSelection && student ? 'hover:border-brand-400 shadow-sm' : ''}
                        ${onToggleSelection || isFurnitureMode ? 'cursor-pointer hover:bg-brand-50' : (isVoid ? '' : 'cursor-move')}
                        ${isVoid && !onToggleSelection && !isFurnitureMode ? 'opacity-30 pointer-events-none' : ''} 
                        ${isVoid && (onToggleSelection || isFurnitureMode) ? 'pattern-diagonal-lines opacity-100' : ''}
                    `;
                    // Note: pattern-diagonal-lines is not a standard utility, using opacity/stripes is better.
                    // For Void in selection mode, let's just make it look distinct (e.g. hatched).
                    // Actually, let's simple use opacity for now.

                    return (
                        <div
                            key={index}
                            className={`
                                relative aspect-[4/3] rounded-lg border-2 flex flex-col items-center justify-center p-1 text-center transition-all group w-full
                                ${finalClass}
                                ${spacingClass}
                            `}
                            draggable={!onToggleSelection && !isVoid}
                            onDragStart={(e) => !isVoid && handleDragStart(e, index, student)}
                            onDrop={(e) => !isVoid && handleDrop(e, index)}
                            onDragOver={!isVoid ? handleDragOver : undefined}
                            onClick={() => {
                                if (onToggleSelection) onToggleSelection(index);
                                else if (isFurnitureMode && onFurnitureClick) onFurnitureClick(index);
                            }}
                        >
                            {isVoid && !student && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                    <window.Icon name="ban" size={32} className="text-slate-400" />
                                </div>
                            )}
                            {student ? (
                                <>
                                    <div className="w-10 h-10 rounded-full bg-white border border-slate-100 text-brand-700 flex items-center justify-center font-bold mb-2 shadow-sm pointer-events-none leading-[2.5rem] print:shadow-none">
                                        <span className="mt-0.5 inline-block">{student.name.substring(0, 2).toUpperCase()}</span>
                                    </div>
                                    <div className="font-semibold text-slate-800 text-sm leading-tight pointer-events-none break-words w-full px-1">
                                        {student.name}
                                    </div>

                                    {/* Action Buttons (Visible always) */}
                                    {!onToggleSelection && !isStudentMode && (
                                        <div className="absolute top-1 right-1 z-20 print:hidden">
                                            <button
                                                className="p-1.5 bg-white shadow-sm border border-slate-200 rounded text-slate-400 hover:text-brand-600 hover:border-brand-300 transition-all"
                                                onClick={(e) => { e.stopPropagation(); onEdit(student.id); }}
                                                title="Settings"
                                            >
                                                <window.Icon name="settings" size={14} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Constraints Indicators */}
                                    {!isStudentMode && (
                                        <div className="absolute bottom-1 left-2 flex gap-1 pointer-events-none print:hidden">
                                            {student.constraints.includes('lock_front') && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Front Locked"></div>}
                                            {student.constraints.includes('lock_back') && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Back Locked"></div>}
                                            {student.lockedSeat !== undefined && student.lockedSeat !== null && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" title="Locked to Seat"></div>}
                                            {student.buddies && student.buddies.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Has Buddies"></div>}
                                            {student.enemies && student.enemies.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-red-500" title="Separation Rule"></div>}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <span className={`text-xs font-bold select-none ${groupColorStr ? 'text-slate-500/50' : 'text-slate-300'}`}>{index + 1}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };
})();
