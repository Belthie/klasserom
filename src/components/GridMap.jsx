
(function () {
    window.GridMap = ({ layout, roomConfig, onSwap, onAssign, onEdit, selection, violationIndices, onToggleSelection, customGroups = [] }) => {
        const { rows, cols, grouping } = roomConfig;

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
            if (customGroup) return customGroup.color;

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
            if (customGroup) return `custom-${customGroup.id}`;

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
                {layout.map((student, index) => {
                    const isSelected = selection && selection.includes(index);
                    const isViolation = violationIndices && violationIndices.includes(index);
                    const groupColorStr = getGroupColor(index);
                    const spacingClass = getSpacingClass(index);

                    // Priority: Selected (Blue) > Violation (Red) > Group Color > Default
                    let baseColor = 'bg-white';
                    let borderColor = 'border-slate-200';

                    if (isSelected) {
                        baseColor = 'bg-brand-100';
                        borderColor = 'border-brand-500 ring-2 ring-brand-300 ring-offset-1 z-20';
                    } else if (isViolation) {
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
                        ${!onToggleSelection && !student ? 'hover:bg-opacity-80' : ''}
                        ${!onToggleSelection && student ? 'hover:border-brand-400 shadow-sm' : ''}
                        ${onToggleSelection ? 'cursor-pointer hover:bg-brand-50' : 'cursor-move'}
                    `;

                    return (
                        <div
                            key={index}
                            className={`
                                relative min-h-[100px] rounded-lg border-2 flex flex-col items-center justify-center p-2 text-center transition-all group
                                ${finalClass}
                                ${spacingClass}
                            `}
                            draggable={!onToggleSelection}
                            onDragStart={(e) => handleDragStart(e, index, student)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragOver={handleDragOver}
                            onClick={() => onToggleSelection && onToggleSelection(index)}
                        >
                            {student ? (
                                <>
                                    <div className="w-8 h-8 rounded-full bg-white/90 border border-slate-100 text-brand-700 flex items-center justify-center font-bold mb-2 shadow-sm pointer-events-none">
                                        {student.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2 pointer-events-none">
                                        {student.name}
                                    </div>

                                    {/* Action Buttons (Visible on hover when NOT in selection mode) */}
                                    {!onToggleSelection && (
                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
                                            <button
                                                className="p-1 bg-white/80 hover:bg-white text-slate-500 hover:text-brand-600 rounded shadow-sm"
                                                onClick={(e) => { e.stopPropagation(); onEdit(student.id); }}
                                                title="Settings"
                                            >
                                                <window.Icon name="settings" size={12} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Constraints Indicators */}
                                    <div className="absolute bottom-1 left-2 flex gap-1 pointer-events-none">
                                        {student.constraints.includes('lock_front') && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Front Locked"></div>}
                                        {student.constraints.includes('lock_back') && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Back Locked"></div>}
                                        {student.lockedSeat !== undefined && student.lockedSeat !== null && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" title="Locked to Seat"></div>}
                                        {student.buddies && student.buddies.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Has Buddies"></div>}
                                        {student.enemies && student.enemies.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-red-500" title="Separation Rule"></div>}
                                    </div>
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
