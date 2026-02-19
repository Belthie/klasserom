
(function () {
    window.RoomTab = ({ classTitle, roomConfig, onUpdateConfig, layout, onFurnitureClick, customGroups, onCreateGroup, onClearGroups, students, onGenerate, onSwap, onAssign, score, onEdit, onUndo, onRedo, canUndo, canRedo, pickedHistory, onPickStudent, onResetPickHistory, isStudentMode }) => {
        const [activeTool, setActiveTool] = React.useState('seating'); // 'seating' | 'furniture' | 'group'
        const [selection, setSelection] = React.useState([]);
        const [showPicker, setShowPicker] = React.useState(false);
        const [pickMode, setPickMode] = React.useState('random'); // 'random' | 'cycle'
        const [pickedStudent, setPickedStudent] = React.useState(null);
        // isStudentMode passed as prop

        // Safety checks for dependencies
        const GridMap = window.GridMap || (() => <div className="p-4 text-red-500 font-bold bg-red-100 rounded">Error: GridMap component not found. Check console.</div>);
        const Icon = window.Icon || (({ name }) => <span className="text-xs text-red-500">[{name}]</span>);

        if (!window.GridMap) console.error("RoomTab: window.GridMap is undefined");
        if (!window.Icon) console.error("RoomTab: window.Icon is undefined");

        const handlePick = () => {
            let candidates = students.filter(s => s.name);
            if (pickMode === 'cycle') {
                candidates = candidates.filter(s => !(pickedHistory || []).includes(s.id));
                if (candidates.length === 0) {
                    alert("Alle elever er trukket! Nullstill historikk for å starte på nytt.");
                    return;
                }
            }
            if (candidates.length === 0) return;

            const randomIndex = Math.floor(Math.random() * candidates.length);
            const selected = candidates[randomIndex];
            setPickedStudent(selected);
            onPickStudent(selected.id);
        };

        const handleToggleSelection = (index) => {
            if (activeTool !== 'group') return;
            setSelection(prev => {
                if (prev.includes(index)) return prev.filter(i => i !== index);
                return [...prev, index];
            });
        };

        const handleCreateGroup = () => {
            if (selection.length === 0) return;
            onCreateGroup(selection);
            setSelection([]);
        };

        return (
            <div className="flex h-full">
                {/* Sidebar Controls - Hidden on Print */}
                {/* Sidebar Controls - Hidden on Print or Student Mode */}
                {/* Sidebar Controls - Hidden on Print or Student Mode */}
                {!isStudentMode && (
                    <div className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col h-full overflow-y-auto shrink-0 z-10 print:hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Icon name="layout" size={24} className="text-indigo-600" />
                                Klasserom
                            </h2>
                            <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <button
                                    onClick={onUndo}
                                    disabled={!canUndo}
                                    className={`text-sm font-bold transition-all ${canUndo ? 'text-indigo-600 hover:text-indigo-800' : 'text-slate-300 cursor-not-allowed'}`}
                                >
                                    Angre
                                </button>
                                <div className="w-px h-3 bg-slate-200"></div>
                                <button
                                    onClick={onRedo}
                                    disabled={!canRedo}
                                    className={`text-sm font-bold transition-all ${canRedo ? 'text-indigo-600 hover:text-indigo-800' : 'text-slate-300 cursor-not-allowed'}`}
                                >
                                    Gjør om
                                </button>
                            </div>
                        </div>


                        <div className={`space-y-6 transition-opacity duration-300 ${isStudentMode ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                            {/* View Toggle */}
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setIsStudentMode(false)}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${!isStudentMode ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                                >
                                    Lærer
                                </button>
                                <button
                                    onClick={() => setIsStudentMode(true)}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${isStudentMode ? 'bg-indigo-600 shadow text-white' : 'text-slate-500'}`}
                                >
                                    Elevvisning
                                </button>
                            </div>

                            {/* 0. Random Picker (Quick Action) */}
                            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <button
                                    onClick={() => setShowPicker(true)}
                                    className="w-full py-2 bg-white text-indigo-700 font-bold text-sm rounded-lg shadow-sm hover:shadow border border-indigo-200 flex items-center justify-center gap-2 transition-all"
                                >
                                    <Icon name="shuffle" size={16} />
                                    Trekk tilfeldig elev
                                </button>
                            </div>
                            {/* 1. Main Actions (Generation) - Only visible in Seating Mode */}
                            {activeTool === 'seating' && (
                                <div className="space-y-4">
                                    <button
                                        onClick={onGenerate}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Icon name="sparkles" size={18} />
                                        Generer Plassering
                                    </button>

                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Regler</h3>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-3 cursor-pointer" title="Systemet vil etter beste evne forsøke å blande gutter og jenter for å unngå rene gutte- eller jenterekker.">
                                                <div className={`w-4 h-4 rounded flex items-center justify-center border ${roomConfig.enableGenderBalance ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                                    {roomConfig.enableGenderBalance && <Icon name="check" size={12} className="text-white" />}
                                                </div>
                                                <input type="checkbox" className="hidden" checked={roomConfig.enableGenderBalance} onChange={e => {
                                                    onUpdateConfig({
                                                        enableGenderBalance: e.target.checked,
                                                        ...(e.target.checked ? { enableSameGender: false } : {})
                                                    });
                                                }} />
                                                <span className="text-sm font-medium text-slate-700">Kjønnsbalanse</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer" title="Systemet vil etter beste evne forsøke å plassere elever med ulike faglige nivåer sammen.">
                                                <div className={`w-4 h-4 rounded flex items-center justify-center border ${roomConfig.enableAcademicDiversity ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                                    {roomConfig.enableAcademicDiversity && <Icon name="check" size={12} className="text-white" />}
                                                </div>
                                                <input type="checkbox" className="hidden" checked={roomConfig.enableAcademicDiversity} onChange={e => onUpdateConfig({ enableAcademicDiversity: e.target.checked })} />
                                                <span className="text-sm font-medium text-slate-700">Faglig spredning</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer" title="Systemet vil etter beste evne forsøke å plassere elever av samme kjønn sammen.">
                                                <div className={`w-4 h-4 rounded flex items-center justify-center border ${roomConfig.enableSameGender ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                                    {roomConfig.enableSameGender && <Icon name="check" size={12} className="text-white" />}
                                                </div>
                                                <input type="checkbox" className="hidden" checked={roomConfig.enableSameGender} onChange={e => {
                                                    onUpdateConfig({
                                                        enableSameGender: e.target.checked,
                                                        ...(e.target.checked ? { enableGenderBalance: false } : {})
                                                    });
                                                }} />
                                                <span className="text-sm font-medium text-slate-700">Samme kjønn</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. Tools Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Verktøy</label>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => { setActiveTool('seating'); setSelection([]); }}
                                        className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex flex-col items-center gap-1 ${activeTool === 'seating' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Icon name="users" size={14} />
                                        Plassering
                                    </button>
                                    <button
                                        onClick={() => { setActiveTool('furniture'); setSelection([]); }}
                                        className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex flex-col items-center gap-1 ${activeTool === 'furniture' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Icon name="grid" size={14} />
                                        Møblering
                                    </button>
                                    <button
                                        onClick={() => setActiveTool('group')}
                                        className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex flex-col items-center gap-1 ${activeTool === 'group' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Icon name="layers" size={14} />
                                        Gruppering
                                    </button>
                                </div>

                                {/* Tool Specific Controls */}
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                    {activeTool === 'seating' && (
                                        <div className="space-y-4">
                                            <div className="text-xs text-slate-500 leading-relaxed">
                                                Dra og slipp elever for å bytte plasser manuelt. Bruk "Generer" for automatisk plassering.
                                                {score && score.violations.length > 0 && (
                                                    <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                                                        <h4 className="font-bold text-red-800 mb-1 flex items-center gap-1"><Icon name="alert-circle" size={12} /> {score.violations.length} Regler brutt</h4>
                                                        <ul className="list-disc list-inside space-y-0.5">
                                                            {score.violations.slice(0, 3).map((v, i) => <li key={i}>{v.student.name}</li>)}
                                                            {score.violations.length > 3 && <li>...</li>}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => window.print()}
                                                className="w-full py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Icon name="printer" size={16} /> Skriv ut / PDF
                                            </button>
                                        </div>
                                    )}

                                    {activeTool === 'furniture' && (
                                        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                                            <h4 className="font-bold text-indigo-900 text-sm mb-2 flex items-center gap-2">
                                                <Icon name="info" size={16} /> Fjern/Legg til
                                            </h4>
                                            <p className="text-xs text-indigo-700 leading-relaxed">
                                                Klikk på en pult i kartet for å fjerne den (lage et hull/gang) eller sette den tilbake.
                                            </p>
                                            <div className="mt-4 pt-4 border-t border-indigo-200">
                                                <label className="block text-xs font-bold text-indigo-900 mb-2">Dimensjoner</label>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <label className="text-[10px] text-indigo-700 block mb-1">Rader</label>
                                                        <input type="number" min="2" max="15" value={roomConfig.rows} onChange={e => onUpdateConfig({ rows: parseInt(e.target.value) })} className="w-full p-1 text-sm rounded border border-indigo-200" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-[10px] text-indigo-700 block mb-1">Kolonner</label>
                                                        <input type="number" min="2" max="15" value={roomConfig.cols} onChange={e => onUpdateConfig({ cols: parseInt(e.target.value) })} className="w-full p-1 text-sm rounded border border-indigo-200" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTool === 'group' && (
                                        <div className="space-y-4">
                                            <div className="bg-white rounded-lg p-4 border border-slate-200">
                                                <p className="text-xs text-slate-600 mb-3">Velg pulter manuelt for å lage en gruppe:</p>
                                                <button
                                                    onClick={handleCreateGroup}
                                                    disabled={selection.length === 0}
                                                    className={`w-full py-2 rounded-lg text-sm font-bold transition-colors ${selection.length > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                                >
                                                    Lag Manuell Gruppe ({selection.length})
                                                </button>
                                            </div>
                                            <button
                                                onClick={onClearGroups}
                                                className="w-full py-2 text-xs text-red-500 font-medium hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                Slett alle manuelle grupper
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* Main Preview Area */}
                <div className={`flex-1 bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center p-8 print:p-0 print:bg-white print:block print:overflow-visible transition-colors duration-500 ${isStudentMode ? 'bg-slate-900' : ''}`}>

                    {/* Student View Exit Button */}
                    {/* Student View Controls (Minimal) - Hidden on Print */}
                    {isStudentMode && (
                        <div className="absolute top-6 left-6 z-50 print:hidden">
                            <button
                                onClick={() => setShowPicker(true)}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all animate-in fade-in slide-in-from-top-4"
                            >
                                <Icon name="shuffle" size={20} />
                                Trekk tilfeldig elev
                            </button>
                        </div>
                    )}

                    {/* Print Header */}
                    <div className="hidden print:block w-full mb-6 border-b pb-4">
                        <h1 className="text-2xl font-bold text-slate-900">{classTitle}</h1>
                        <p className="text-sm text-slate-500">Klassekart • {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="w-full h-12 mb-8 bg-white/50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-sm font-bold uppercase tracking-widest print:border-slate-800 print:text-slate-800">
                        Tavle / Lærers bord
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-4xl max-h-full overflow-auto w-full print:border-none print:shadow-none print:p-0 print:overflow-visible">
                        <GridMap
                            layout={layout}
                            roomConfig={roomConfig}
                            students={students}
                            isFurnitureMode={activeTool === 'furniture'}
                            onFurnitureClick={onFurnitureClick}
                            customGroups={customGroups}

                            // Seating Props (Pass through)
                            onSwap={activeTool === 'seating' ? onSwap : undefined}
                            onAssign={activeTool === 'seating' ? onAssign : undefined}
                            onEdit={onEdit}

                            // Selection Props
                            selection={selection}
                            onToggleSelection={activeTool === 'group' ? handleToggleSelection : undefined}

                            // View Mode
                            isStudentMode={isStudentMode}
                        />
                    </div>
                </div>


                {/* Random Picker Modal */}
                {
                    showPicker && (
                        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPicker(false)}>
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                        <Icon name="shuffle" size={18} className="text-indigo-600" />
                                        Trekk elev
                                    </h3>
                                    <button onClick={() => setShowPicker(false)} className="p-1 hover:bg-slate-200 rounded-full"><Icon name="x" size={20} /></button>
                                </div>

                                <div className="p-6 text-center">
                                    {pickedStudent ? (
                                        <div className="animate-in zoom-in duration-300">
                                            <p className="text-sm text-slate-400 uppercase font-bold tracking-wider mb-2">Resultat</p>
                                            <div className="text-4xl font-black text-slate-800 mb-6 bg-slate-50 py-8 rounded-2xl border border-slate-100 shadow-inner">
                                                {pickedStudent.name}
                                            </div>
                                            <button
                                                onClick={() => setPickedStudent(null)}
                                                className="text-indigo-600 hover:underline text-sm font-medium"
                                            >
                                                Trekk en til
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                                <button
                                                    onClick={() => setPickMode('random')}
                                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${pickMode === 'random' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    Helt tilfeldig
                                                </button>
                                                <button
                                                    onClick={() => setPickMode('cycle')}
                                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${pickMode === 'cycle' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    Gjennomgang
                                                    {(pickedHistory || []).length > 0 && <span className="ml-1 text-xs opacity-70">({(pickedHistory || []).length})</span>}
                                                </button>
                                            </div>

                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600">
                                                {pickMode === 'random'
                                                    ? "Trekker en tilfeldig elev fra hele listen hver gang (samme elev kan trekkes flere ganger)."
                                                    : `Trekker en elev som IKKE har blitt trukket ennå. (${students.length - (pickedHistory || []).length} igjen).`
                                                }
                                            </div>

                                            <button
                                                onClick={handlePick}
                                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 text-lg transition-all transform active:scale-95"
                                            >
                                                Trekk nå!
                                            </button>

                                            {pickMode === 'cycle' && (pickedHistory || []).length > 0 && (
                                                <button
                                                    onClick={onResetPickHistory}
                                                    className="text-xs text-red-500 hover:text-red-700 hover:underline"
                                                >
                                                    Nullstill historikk ({pickedHistory.length} trukket)
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        );
    };
})();

