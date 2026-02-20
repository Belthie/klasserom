(function () {
    window.Navbar = ({ activeTab, onTabChange, className, activeClass, classrooms, onChangeClass, onAddClass, onExport, onLoad, onReset, onDeleteClass, onRenameClass, onOpenTutorial, isStudentMode, onToggleStudentMode }) => {
        const tabs = [
            { id: 'room', label: 'Klasserom', icon: 'layout' },
            { id: 'groups', label: 'Tilfeldige Grupper', icon: 'shuffle' },
            { id: 'random', label: 'Trekk Elev', icon: 'user' },
        ].filter(t => !t.hidden);

        return (
            <nav className={`h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-30 print:hidden ${className}`}>
                {/* Left: Brand, Class Selector, Actions */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-indigo-600">
                        <window.Icon name="grid" size={24} className="text-indigo-600" />
                        <span className="font-bold text-lg tracking-tight text-slate-900">SmartPlass</span>
                    </div>

                    <div className="h-6 w-px bg-slate-200"></div>

                    {/* Class Selector Dropdown */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100">
                            {activeClass.name}
                            <window.Icon name="chevron-down" size={14} className="text-indigo-400" />
                        </button>

                        <div className="absolute top-full left-0 pt-2 w-64 hidden group-hover:block z-50">
                            <div className="bg-white rounded-lg shadow-xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-2">
                                <ul className="space-y-1 max-h-[60vh] overflow-y-auto">
                                    {Object.values(classrooms).map(c => (
                                        <li key={c.id} className="flex items-center gap-1 group/item">
                                            <button
                                                onClick={() => onChangeClass(c.id)}
                                                className={`flex-1 text-left px-3 py-2 rounded-md text-sm flex justify-between items-center ${activeClass.id === c.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                                            >
                                                <span className="truncate">{c.name}</span>
                                            </button>

                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onRenameClass(c.id, c.name);
                                                }}
                                                className="p-1.5 text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-md transition-colors shadow-sm ml-1"
                                                title="Endre navn på klasse"
                                            >
                                                <window.Icon name="edit-2" size={14} />
                                            </button>

                                            {Object.keys(classrooms).length > 1 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        onDeleteClass(c.id);
                                                    }}
                                                    className="p-1.5 text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-md transition-colors shadow-sm"
                                                    title="Slett klasse"
                                                >
                                                    <window.Icon name="x" size={14} />
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                                <div className="border-t border-slate-100 my-2"></div>
                                <button onClick={onAddClass} className="w-full text-left px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-md flex items-center gap-2">
                                    <window.Icon name="plus" size={12} /> Ny klasse
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-slate-200"></div>

                    {/* Actions: Save / Open */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onExport}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                            title="Lagre nåværende klasse til fil"
                        >
                            <window.Icon name="save" size={14} />
                            Lagre
                        </button>
                        <button
                            onClick={onLoad}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                            title="Åpne en lagret klassefil"
                        >
                            <window.Icon name="folder-open" size={14} />
                            Åpne
                        </button>
                    </div>
                </div>

                {/* Center: Tabs */}
                <div className="flex items-center bg-slate-100/50 p-1 rounded-lg border border-slate-200/50 absolute left-1/2 -translate-x-1/2">
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                                    ${isActive
                                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                                `}
                            >
                                <window.Icon name={tab.icon} size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    {/* Student View Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => onToggleStudentMode(false)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!isStudentMode ? 'bg-white shadow text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Lærer
                        </button>
                        <button
                            onClick={() => onToggleStudentMode(true)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${isStudentMode ? 'bg-indigo-600 shadow text-white font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Elevvisning
                        </button>
                    </div>

                    <div className="h-6 w-px bg-slate-200"></div>

                    <button
                        onClick={onOpenTutorial}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full hover:bg-indigo-100 transition-all hover:shadow-sm"
                    >
                        <window.Icon name="play-circle" size={16} />
                        Videoopplæring
                    </button>
                </div>
            </nav >
        );
    };
})();
